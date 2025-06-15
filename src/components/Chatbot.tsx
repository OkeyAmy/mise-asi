
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
import { useShoppingList } from "@/hooks/useShoppingList";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

interface ChatbotProps {
  plan: MealPlan;
  setPlan: React.Dispatch<React.SetStateAction<MealPlan>>;
  isShoppingListOpen: boolean;
  setIsShoppingListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setThoughtSteps: React.Dispatch<React.SetStateAction<ThoughtStep[]>>;
  session?: Session | null;
}

export const Chatbot = ({
  plan,
  setPlan,
  isShoppingListOpen,
  setIsShoppingListOpen,
  setThoughtSteps,
  session,
}: ChatbotProps) => {
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

  // Use the actual active mealPlan's ID
  const mealPlanId = plan.plan_id;

  // Maintain session (fallback for old prop pattern)
  const [userSession, setUserSession] = useState<Session | null>(
    session || null
  );
  useEffect(() => {
    if (session) setUserSession(session);
  }, [session]);

  // Hook for getting/updating shopping list in realtime with Supabase
  const {
    items: shoppingListItems,
    isLoading: isListLoading,
    removeItem,
    saveList,
  } = useShoppingList(userSession, mealPlanId);

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
    onUpdateShoppingList: (newList: ShoppingListItem[]) => {
      // Overwrite DB and UI version of shopping list whenever AI asks to refresh
      saveList(newList);
    },
  });

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem("gemini_api_key", key);
    setApiKey(key);
    setIsApiKeyDialogOpen(false);
    toast.success("API Key saved successfully!");
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
          <ShoppingList
            items={shoppingListItems}
            isLoading={isListLoading}
            onRemove={removeItem}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
