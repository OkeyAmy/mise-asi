import { useState } from "react";
import { toast } from "sonner";
import { MealPlan, ThoughtStep } from "@/data/schema";
import { callGemini, callGeminiWithStreaming } from "@/lib/gemini";
import OpenAI from "openai";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

const initialMessages: Message[] = [
  { id: 1, text: "Welcome to NutriMate! To get started, tell me about your eating habits, any restrictions, and your nutrition goals. You can also tell me what ingredients you have in your pantry.", sender: "bot" }
];

interface UseChatProps {
  apiKey: string | null;
  setPlan: React.Dispatch<React.SetStateAction<MealPlan>>;
  setIsShoppingListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setThoughtSteps: React.Dispatch<React.SetStateAction<ThoughtStep[]>>;
  onApiKeyMissing: () => void;
}

export const useChat = ({ apiKey, setPlan, setIsShoppingListOpen, setThoughtSteps, onApiKeyMissing }: UseChatProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const addThoughtStep = (step: string, details?: string, status: 'pending' | 'active' | 'completed' = 'completed') => {
    const newStep: ThoughtStep = {
      id: Date.now().toString() + Math.random(),
      step,
      status,
      details: details || step
    };
    setThoughtSteps(prev => [...prev, newStep]);
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;

    if (!apiKey) {
      onApiKeyMissing();
      toast.error("Please set your Gemini API key first.");
      return;
    }

    const userInput = inputValue.trim();
    const userMessage: Message = { id: Date.now(), text: userInput, sender: "user" };
    
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsThinking(true);
    // Do NOT reset thought steps here: remove or comment out the line below!
    // setThoughtSteps([]); 

    const history: OpenAI.Chat.ChatCompletionMessageParam[] = newMessages.map(msg => ({
        role: msg.sender === 'bot' ? 'assistant' : 'user',
        content: msg.text,
    }));

    let accumulatedText = "";
    const toolCallDeltas: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall[] = [];
    
    await callGeminiWithStreaming(apiKey, history, {
      onText: (textChunk: string) => {
        accumulatedText += textChunk;
        setMessages(prev => {
            const updatedMessages = [...prev];
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            
            if (lastMessage && lastMessage.sender === 'bot') {
                lastMessage.text = accumulatedText;
                return updatedMessages;
            } else {
                const newBotMessage: Message = { id: Date.now() + 5000, text: accumulatedText, sender: 'bot' };
                return [...updatedMessages, newBotMessage];
            }
        });
      },
      onFunctionCall: (toolCallDelta: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall) => {
        if (toolCallDelta.index !== undefined) {
             if (!toolCallDeltas[toolCallDelta.index]) {
                toolCallDeltas[toolCallDelta.index] = { index: toolCallDelta.index };
            }
            const current = toolCallDeltas[toolCallDelta.index];
            if (toolCallDelta.id) current.id = toolCallDelta.id;
            if (toolCallDelta.type) current.type = toolCallDelta.type;
            if (toolCallDelta.function) {
                if (!current.function) current.function = { name: "", arguments: "" };
                if (toolCallDelta.function.name) current.function.name = toolCallDelta.function.name;
                if (toolCallDelta.function.arguments) current.function.arguments += toolCallDelta.function.arguments;
            }
        }
      },
      onComplete: async () => {
        setIsThinking(false);

        if (toolCallDeltas.length > 0 && toolCallDeltas.every(tc => tc.id && tc.function?.name && tc.function?.arguments)) {
            const toolCalls = toolCallDeltas.map(tc => ({
                id: tc.id!,
                type: 'function' as const,
                function: {
                    name: tc.function!.name!,
                    arguments: tc.function!.arguments!,
                }
            }));
            
            addThoughtStep(`🔨 Calling function: ${toolCalls.map(tc => tc.function.name).join(', ')}`, JSON.stringify(toolCalls.map(tc=>tc.function), null, 2), 'active');

            const toolOutputs: OpenAI.Chat.ChatCompletionToolMessageParam[] = [];

            for (const toolCall of toolCalls) {
                let funcResultMsg = "";
                if (toolCall.function.name === 'updateMealPlan') {
                    try {
                        const args = JSON.parse(toolCall.function.arguments);
                        setPlan(args as MealPlan);
                        funcResultMsg = "Meal plan updated successfully.";
                        addThoughtStep(`✅ Executed: updateMealPlan`);
                    } catch(e) {
                         funcResultMsg = `Error parsing arguments for updateMealPlan: ${e instanceof Error ? e.message : String(e)}`;
                         addThoughtStep(`❌ Error executing updateMealPlan`);
                    }
                } else if (toolCall.function.name === 'showShoppingList') {
                    setIsShoppingListOpen(true);
                    funcResultMsg = "Shopping list is now open.";
                    addThoughtStep("✅ Executed: showShoppingList");
                }
                toolOutputs.push({
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    content: funcResultMsg
                });
            }

            const historyWithFunctionCall: OpenAI.Chat.ChatCompletionMessageParam[] = [
                ...history,
                { role: 'assistant', tool_calls: toolCalls },
                ...toolOutputs
            ];
            
            addThoughtStep("💬 Generating final response...");
            try {
                const finalResultResponse = await callGemini(apiKey, historyWithFunctionCall);
                const finalText = finalResultResponse.choices[0]?.message?.content ?? '';
                if (finalText) {
                    const botMessage: Message = { id: Date.now() + 1, text: finalText, sender: "bot" };
                    setMessages(prev => [...newMessages, botMessage]);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                toast.error(errorMessage);
                addThoughtStep(`❌ Error in final response: ${errorMessage}`);
            }

        } else if (accumulatedText.trim() === "") {
            const fallbackMessage: Message = { id: Date.now() + 1, text: "I'm not sure how to respond to that. Can you try rephrasing?", sender: "bot" };
            setMessages(prev => [...prev, fallbackMessage]);
        }
        
        addThoughtStep("✨ Done!");
      },
      onError: (error: Error) => {
        setIsThinking(false);
        const errorMessage = error.message;
        toast.error(errorMessage);
        addThoughtStep(`❌ Error: ${errorMessage}`);
      }
    });
  };

  return {
    messages,
    inputValue,
    setInputValue,
    isThinking,
    handleSendMessage,
  };
};
