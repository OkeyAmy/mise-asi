import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { ShoppingList } from "./ShoppingList";
import { Dialog, DialogContent } from "./ui/dialog";
import { MealPlan, ShoppingListItem, ThoughtStep, UserPreferences } from "@/data/schema";
import { ApiKeyDialog } from "./ApiKeyDialog";
import { toast } from "sonner";
import { useChat } from "@/hooks/useChat";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { usePreferences } from "@/hooks/usePreferences";

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

  const mealPlanId = plan.plan_id;

  const [userSession, setUserSession] = useState<Session | null>(
    session || null
  );
  useEffect(() => {
    if (session) setUserSession(session);
  }, [session]);

  const {
    items: shoppingListItems,
    isLoading: isListLoading,
    removeItem,
    removeItems,
    addItems,
    saveList,
  } = useShoppingList(userSession, mealPlanId);

  const { items: inventoryItems, upsertItem } = useInventory(userSession);

  const { preferences, updatePreferences } = usePreferences(userSession);

  const {
    messages,
    inputValue,
    setInputValue,
    isThinking,
    handleSendMessage,
    resetConversation,
  } = useChat({
    apiKey,
    setPlan,
    setIsShoppingListOpen,
    setThoughtSteps,
    onApiKeyMissing: () => setIsApiKeyDialogOpen(true),
    onUpdateShoppingList: (newList: ShoppingListItem[]) => {
      saveList(newList);
    },
    onAddItemsToShoppingList: async (items) => {
      await addItems(items);
      toast.success("I've updated your shopping list.");
    },
    onRemoveItemsFromShoppingList: async (itemNames) => {
      await removeItems(itemNames);
      toast.success("I've removed the items from your shopping list.");
    },
    shoppingListItems,
    onUpdateInventory: async (items) => {
      for (const item of items) {
        await upsertItem({
          ...item,
          location: item.location || 'pantry',
          notes: item.notes || 'Added by AI',
        });
      }
      toast.success("Your inventory has been updated.");
    },
    onGetInventory: async () => {
      return inventoryItems;
    },
    onGetUserPreferences: async () => {
      return preferences;
    },
    onUpdateUserPreferences: async (updates) => {
      await updatePreferences(updates as Partial<UserPreferences>);
    },
  });

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem("gemini_api_key", key);
    setApiKey(key);
    setIsApiKeyDialogOpen(false);
    toast.success("API Key saved successfully!");
  };

  return (
    <div className="h-screen flex flex-col relative">
      <ApiKeyDialog
        isOpen={isApiKeyDialogOpen}
        onClose={() => setIsApiKeyDialogOpen(false)}
        onSave={handleSaveApiKey}
      />
      <Dialog open={isShoppingListOpen} onOpenChange={setIsShoppingListOpen}>
        <Card className="flex flex-col h-full shadow-none border-0">
          <ChatHeader onResetConversation={resetConversation} />
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden pb-20">
            <ChatMessageList messages={messages} isThinking={isThinking} />
          </CardContent>
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border">
            <ChatInput
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleSendMessage={handleSendMessage}
              isThinking={isThinking}
            />
          </div>
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
