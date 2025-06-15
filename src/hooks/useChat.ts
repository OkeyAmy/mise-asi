
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Content, FunctionCall } from "@google/generative-ai";
import { MealPlan, ShoppingListItem, ThoughtStep } from "@/data/schema";
import { callGemini, callGeminiWithStreaming } from "@/lib/gemini";
import { InventoryItem } from "@/hooks/useInventory";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

const initialMessages: Message[] = [
  {
    id: 1,
    text: "Welcome to NutriMate! To get started, tell me about your eating habits, any restrictions, and your nutrition goals. You can also tell me what ingredients you have in your pantry.",
    sender: "bot",
  },
];

const getInitialMessages = (): Message[] => {
  if (typeof window === 'undefined') return initialMessages;
  try {
    const stored = localStorage.getItem("chat_history");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Could not parse chat history from local storage", e);
  }
  return initialMessages;
}

interface UseChatProps {
  apiKey: string | null;
  setPlan: React.Dispatch<React.SetStateAction<MealPlan>>;
  setIsShoppingListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setThoughtSteps: React.Dispatch<React.SetStateAction<ThoughtStep[]>>;
  onApiKeyMissing: () => void;
  onUpdateShoppingList?: (items: ShoppingListItem[]) => void;
  onUpdateInventory?: (items: { item_name: string; quantity: number; unit: string; category: string; location?: string; notes?: string; }[]) => Promise<void>;
  onGetInventory?: () => Promise<InventoryItem[]>;
}

export const useChat = ({
  apiKey,
  setPlan,
  setIsShoppingListOpen,
  setThoughtSteps,
  onApiKeyMissing,
  onUpdateShoppingList,
  onUpdateInventory,
  onGetInventory,
}: UseChatProps) => {
  const [messages, setMessages] = useState<Message[]>(getInitialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  const addThoughtStep = (
    step: string,
    details?: string,
    status: "pending" | "active" | "completed" = "completed"
  ) => {
    const newStep: ThoughtStep = {
      id: Date.now().toString() + Math.random(),
      step,
      status,
      details: details || step,
    };
    setThoughtSteps((prev) => [...prev, newStep]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;

    if (!apiKey) {
      onApiKeyMissing();
      toast.error("Please set your Gemini API key first.");
      return;
    }

    setThoughtSteps(prev => 
      prev.map(s => ({ ...s, status: s.status === 'active' ? 'completed' : s.status }))
    );

    const userInput = inputValue.trim();
    const userMessage: Message = {
      id: Date.now(),
      text: userInput,
      sender: "user",
    };

    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsThinking(true);

    const history: Content[] = newMessages.map((msg) => ({
      role: msg.sender === "bot" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

    let accumulatedText = "";
    let functionCall: FunctionCall | null = null;

    await callGeminiWithStreaming(apiKey, history, {
      onThought: (thought: string) => {
        addThoughtStep(thought);
      },
      onText: (textChunk: string) => {
        accumulatedText += textChunk;
        setMessages((prev) => {
          const updatedMessages = [...prev];
          const lastMessage = updatedMessages[updatedMessages.length - 1];

          if (lastMessage && lastMessage.sender === "bot") {
            lastMessage.text = accumulatedText;
            return updatedMessages;
          } else {
            const newBotMessage: Message = {
              id: Date.now() + 5000,
              text: accumulatedText,
              sender: "bot",
            };
            return [...updatedMessages, newBotMessage];
          }
        });
      },
      onFunctionCall: (call: FunctionCall) => {
        if (!functionCall) {
          functionCall = call;
          addThoughtStep(
            `🔨 Preparing to call function: ${call.name}`,
            JSON.stringify(call.args, null, 2),
            "active"
          );
        }
      },
      onComplete: async () => {
        setIsThinking(false);

        if (functionCall) {
          let funcResultMsg = "";
          if (functionCall.name === "updateMealPlan") {
            const newPlan = functionCall.args as MealPlan;
            setPlan(newPlan);
            funcResultMsg = "Meal plan updated successfully.";
            addThoughtStep("✅ Executed: updateMealPlan");
          } else if (functionCall.name === "showShoppingList") {
            // AI generated shopping list (should be in MealPlan), get all ingredients and update supabase
            try {
              const plan = functionCall.args as MealPlan;
              let allIngredients: ShoppingListItem[] = [];
              if (plan?.days) {
                const allIng = new Map<string, ShoppingListItem>();
                plan.days.forEach((day) => {
                  Object.values(day.meals).forEach((meal) => {
                    meal.ingredients.forEach((ing) => {
                      if (allIng.has(ing.item)) {
                        const existing = allIng.get(ing.item)!;
                        existing.quantity += ing.quantity;
                      } else {
                        allIng.set(ing.item, { ...ing });
                      }
                    });
                  });
                });
                allIngredients = Array.from(allIng.values());
              }
              if(onUpdateShoppingList) {
                onUpdateShoppingList(allIngredients);
              }
              funcResultMsg = "Shopping list updated and shown!";
            } catch {
              funcResultMsg = "Couldn't extract shopping list from plan.";
            }
            setIsShoppingListOpen(true);
            addThoughtStep("✅ Executed: showShoppingList");
          } else if (functionCall.name === "updateInventory") {
            try {
              const { items } = functionCall.args as { items: { item_name: string; quantity: number; unit: string; category: string; location?: string; notes?: string; }[] };
              if (onUpdateInventory) {
                await onUpdateInventory(items);
                funcResultMsg = "I've updated your inventory with the new items.";
              } else {
                funcResultMsg = "Inventory function is not available right now.";
              }
            } catch (e) {
              console.error(e);
              funcResultMsg = "I had trouble updating your inventory.";
            }
            addThoughtStep("✅ Executed: updateInventory");
          } else if (functionCall.name === "getInventory") {
            try {
              if (onGetInventory) {
                const inventoryItems = await onGetInventory();
                if (inventoryItems.length > 0) {
                  funcResultMsg = "Here is your current inventory:\n" + inventoryItems.map(item => `- ${item.quantity} ${item.unit} of ${item.item_name}`).join('\n');
                } else {
                  funcResultMsg = "Your inventory is currently empty.";
                }
              } else {
                funcResultMsg = "Inventory function is not available right now.";
              }
            } catch (e) {
              console.error(e);
              funcResultMsg = "I had trouble fetching your inventory.";
            }
            addThoughtStep("✅ Executed: getInventory");
          }

          const functionResponsePart = {
            functionResponse: {
              name: functionCall.name,
              response: { success: true, message: funcResultMsg },
            },
          };

          const historyWithFunctionCall: Content[] = [
            ...history,
            { role: "model", parts: [{ functionCall }] },
            { role: "user", parts: [functionResponsePart] },
          ];

          addThoughtStep("💬 Generating final response...");
          try {
            const finalResultResponse = await callGemini(
              apiKey,
              historyWithFunctionCall
            );
            const finalText =
              finalResultResponse.candidates?.[0]?.content.parts
                .map((p) => p.text)
                .join("") ?? "";
            const botMessage: Message = {
              id: Date.now() + 1,
              text: finalText,
              sender: "bot",
            };
            setMessages((prev) => [...newMessages, botMessage]);
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "An unknown error occurred.";
            toast.error(errorMessage);
            addThoughtStep(`❌ Error in final response: ${errorMessage}`);
          }
        } else if (accumulatedText.trim() === "") {
          const fallbackMessage: Message = {
            id: Date.now() + 1,
            text: "I'm not sure how to respond to that. Can you try rephrasing?",
            sender: "bot",
          };
          setMessages((prev) => [...prev, fallbackMessage]);
        }

        addThoughtStep("✨ Done!");
      },
      onError: (error: Error) => {
        setIsThinking(false);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unknown error occurred.";
        toast.error(errorMessage);
        addThoughtStep(`❌ Error: ${errorMessage}`);
      },
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
