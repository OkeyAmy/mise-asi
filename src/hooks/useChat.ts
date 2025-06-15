
import { useState } from 'react';
import { Content } from '@google/generative-ai';
import { MealPlan as MealPlanType, Message, ThoughtStep } from '@/data/schema';
import { systemPrompt } from '@/lib/prompts/systemPrompt';
import { callGeminiProxy } from './chat/geminiProxy';
import { useChatHistory } from './useChatHistory';
import { useChatData } from './useChatData';
import { executeFunctions } from '@/lib/functions/executeFunctions';
import { Session } from '@supabase/supabase-js';

export interface UseChatProps {
  initialMessages?: Message[];
  initialThoughtSteps?: ThoughtStep[];
  session: Session | null;
  plan: MealPlanType;
  setPlan: React.Dispatch<React.SetStateAction<MealPlanType>>;
  isShoppingListOpen: boolean;
  setIsShoppingListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isLeftoversOpen: boolean;
  setIsLeftoversOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setThoughtSteps: React.Dispatch<React.SetStateAction<ThoughtStep[]>>;
  thoughtSteps: ThoughtStep[];
}

export const useChat = (props: UseChatProps) => {
  const { session, setThoughtSteps } = props;
  const userId = session?.user?.id;

  const { messages, setMessages, thoughtSteps: localThoughtSteps, setThoughtSteps: setLocalThoughtSteps, saveChatHistory } = useChatHistory({
    userId,
    initialMessages: props.initialMessages,
    initialThoughtSteps: props.initialThoughtSteps,
  });

  const {
    functionCallHandler,
    isStarting,
  } = useChatData(props.plan, props.setPlan, props.setIsShoppingListOpen, props.setIsLeftoversOpen);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !userId) return;

    const newUserMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const currentPlan = props.plan;

    try {
      let history: Content[] = [
        { role: 'user', parts: [{ text: systemPrompt(currentPlan) }] },
        { role: 'model', parts: [{ text: "OK. I'm ready to help you with your meal plan." }] },
        ...newMessages.map((msg): Content => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        })),
      ];

      let responseData;
      let newThoughtSteps: ThoughtStep[] = [];

      // Loop to handle multiple function calls
      while (true) {
        setThoughtSteps(prev => [...prev, { id: Date.now().toString(), step: "Thinking...", status: 'running' }]);
        responseData = await callGeminiProxy(history);
        
        const functionCalls = responseData.candidates[0].content.parts
          .filter((part: any) => part.functionCall)
          .map((part: any) => part.functionCall);

        if (functionCalls.length > 0) {
          setThoughtSteps(prev => prev.map(s => s.step === "Thinking..." ? { ...s, step: 'Executing tools...' } : s));

          const { toolResponses, thoughtSteps: executedThoughtSteps } = await executeFunctions(functionCalls, functionCallHandler);
          newThoughtSteps.push(...executedThoughtSteps);
          setThoughtSteps(prev => [...prev, ...executedThoughtSteps]);
          
          history.push(
            {
              role: 'model',
              parts: responseData.candidates[0].content.parts,
            },
            {
              role: 'function',
              parts: toolResponses,
            }
          );

        } else {
          break;
        }
      }

      const modelResponse = responseData.candidates[0].content.parts[0].text;
      const newBotMessage: Message = { id: Date.now().toString(), text: modelResponse, sender: 'bot' };
      const finalMessages = [...newMessages, newBotMessage];
      setMessages(finalMessages);
      setLocalThoughtSteps(prev => [...prev, ...newThoughtSteps]);
      await saveChatHistory(finalMessages, [...localThoughtSteps, ...newThoughtSteps]);

    } catch (error) {
      console.error("Error during chat:", error);
      const errorMessage: Message = { id: Date.now().toString(), text: "Sorry, something went wrong. Please try again.", sender: 'bot' };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      setThoughtSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'complete' } : s));
    }
  };

  return { messages, input, isLoading, handleInputChange, handleSubmit, isStarting };
};
