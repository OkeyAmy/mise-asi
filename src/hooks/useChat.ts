
import { useState } from 'react';
import { Content } from '@google/generative-ai';
import { MealPlan as MealPlanType, Message, ThoughtStep } from '@/data/schema';
import { getSystemPrompt } from '@/lib/prompts/systemPrompt';
import { callGeminiProxy } from './chat/geminiProxy';
import { useChatHistory } from './useChatHistory';
import { executeFunctions } from '@/lib/functions/executeFunctions';
import { Session } from '@supabase/supabase-js';
import { UseChatProps } from './chat/types';

export const useChat = (props: UseChatProps) => {
  const { session, setThoughtSteps } = props;
  const userId = session?.user?.id;

  const { messages, setMessages, thoughtSteps: localThoughtSteps, setThoughtSteps: setLocalThoughtSteps, saveChatHistory, resetChatHistory } = useChatHistory({
    userId,
    initialMessages: [],
    initialThoughtSteps: [],
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };
  
  const resetConversation = () => {
    resetChatHistory();
  };
  
  const functionCallHandler = {
    showShoppingList: () => props.setIsShoppingListOpen(true),
    getShoppingList: () => props.shoppingListItems || [],
    addToShoppingList: props.onAddItemsToShoppingList,
    removeFromShoppingList: props.onRemoveItemsFromShoppingList,
    updateInventory: props.onUpdateInventory,
    getInventory: props.onGetInventory,
    getUserPreferences: props.onGetUserPreferences,
    updateUserPreferences: props.onUpdateUserPreferences,
    showLeftovers: () => props.setIsLeftoversOpen(true),
    getLeftovers: props.onGetLeftovers,
    addLeftover: props.onAddLeftover,
    updateLeftover: props.onUpdateLeftover,
    removeLeftover: props.onRemoveLeftover,
    getCurrentTime: () => new Date().toISOString(),
    // suggestMeal is complex and needs to be handled separately
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
        { role: 'user', parts: [{ text: getSystemPrompt(currentPlan) }] },
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
          setThoughtSteps(prev => prev.map(s => s.step === "Thinking..." ? { ...s, step: 'Executing tools...', status: 'running' } : s));

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
      setThoughtSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'completed' } : s));
    }
  };

  return { messages, inputValue: input, setInputValue: setInput, isThinking: isLoading, handleSendMessage: handleSubmit, resetConversation, isStarting: false };
};
