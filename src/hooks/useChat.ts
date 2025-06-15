import { useState } from "react";
import { toast } from "sonner";
import { Content, FunctionCall } from "@google/generative-ai";
import { MealPlan, ShoppingListItem, ThoughtStep } from "@/data/schema";
import { callGemini, callGeminiWithStreaming } from "@/lib/gemini";
import { supabase } from "@/integrations/supabase/client";

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

interface UseChatProps {
  apiKey: string | null;
  setPlan: React.Dispatch<React.SetStateAction<MealPlan>>;
  setIsShoppingListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setThoughtSteps: React.Dispatch<React.SetStateAction<ThoughtStep[]>>;
  onApiKeyMissing: () => void;
  onUpdateShoppingList?: (items: ShoppingListItem[]) => void;
  session?: any; // Add session to handle inventory updates
}

export const useChat = ({
  apiKey,
  setPlan,
  setIsShoppingListOpen,
  setThoughtSteps,
  onApiKeyMissing,
  onUpdateShoppingList,
  session,
}: UseChatProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);

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
          } else if (functionCall.name === "updateInventory" && session?.user?.id) {
            // Handle inventory updates
            try {
              const inventoryData = functionCall.args as { items: any[] };
              const itemsToAdd = inventoryData.items;
              
              for (const item of itemsToAdd) {
                await supabase
                  .from("user_inventory")
                  .upsert({
                    user_id: session.user.id,
                    item_name: item.item_name,
                    category: item.category,
                    quantity: item.quantity,
                    unit: item.unit,
                    location: item.location || 'pantry',
                    notes: item.notes || ''
                  }, {
                    onConflict: 'user_id,item_name'
                  });
              }
              
              funcResultMsg = `Added ${itemsToAdd.length} item(s) to your inventory.`;
              toast.success("Inventory updated successfully!");
              addThoughtStep("✅ Executed: updateInventory");
            } catch (error) {
              funcResultMsg = "Failed to update inventory.";
              addThoughtStep(`❌ Error updating inventory: ${error}`);
            }
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
