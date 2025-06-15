
import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { ShoppingList } from "./ShoppingList";
import { Dialog, DialogContent } from "./ui/dialog";
import { MealPlan, ShoppingListItem, ThoughtStep } from "@/data/schema";
import { ApiKeyDialog } from "./ApiKeyDialog";
import { toast } from "sonner";
import { useChat } from "@/hooks/useChat";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";

interface ChatbotProps {
  plan: MealPlan;
  setPlan: React.Dispatch<React.SetStateAction<MealPlan>>;
  isShoppingListOpen: boolean;
  setIsShoppingListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setThoughtSteps: React.Dispatch<React.SetStateAction<ThoughtStep[]>>;
  inventory: string[];
  setInventory: React.Dispatch<React.SetStateAction<string[]>>;
}

export const Chatbot = ({ plan, setPlan, isShoppingListOpen, setIsShoppingListOpen, setThoughtSteps, inventory, setInventory }: ChatbotProps) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);

  useEffect(() => {
    let storedApiKey = localStorage.getItem("gemini_api_key");
    if (!storedApiKey) {
      storedApiKey = "AIzaSyB6j2kGAu88UqOhVNN8KSbUjijlXMfdovY";
      localStorage.setItem("gemini_api_key", storedApiKey);
      toast.info("A default API key has been configured.");
    }
    setApiKey(storedApiKey);
  }, []);

  const {
    messages,
    inputValue,
    setInputValue,
    isThinking,
    handleSendMessage,
  } = useChat({
    apiKey,
    setPlan,
    setIsShoppingListOpen,
    setThoughtSteps,
    onApiKeyMissing: () => setIsApiKeyDialogOpen(true),
    inventory,
    setInventory,
  });

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem("gemini_api_key", key);
    setApiKey(key);
    setIsApiKeyDialogOpen(false);
    toast.success("API Key saved successfully!");
  };

  const generateShoppingList = (): ShoppingListItem[] => {
    const allIngredients = new Map<string, ShoppingListItem>();
    plan.days.forEach(day => {
      Object.values(day.meals).forEach(meal => {
        meal.ingredients.forEach(ing => {
          if (allIngredients.has(ing.item)) {
            const existing = allIngredients.get(ing.item)!;
            existing.quantity += ing.quantity;
          } else {
            allIngredients.set(ing.item, { ...ing });
          }
        });
      });
    });
    return Array.from(allIngredients.values());
  };

  return (
    <div className="h-screen flex flex-col">
        <ApiKeyDialog 
            isOpen={isApiKeyDialogOpen}
            onClose={() => setIsApiKeyDialogOpen(false)}
            onSave={handleSaveApiKey}
        />
        <Dialog open={isShoppingListOpen} onOpenChange={setIsShoppingListOpen}>
            <Card className="flex flex-col h-full shadow-none border-0">
              <ChatHeader />
              <CardContent className="flex-1 flex flex-col p-0">
                <ChatMessageList messages={messages} isThinking={isThinking} />
                <ChatInput 
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  handleSendMessage={handleSendMessage}
                  isThinking={isThinking}
                />
              </CardContent>
            </Card>
            <DialogContent className="max-w-md">
                <ShoppingList items={generateShoppingList()} />
            </DialogContent>
        </Dialog>
    </div>
  );
};
