import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { ShoppingList } from "./ShoppingList";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { MealPlan, ShoppingListItem, ThoughtStep, UserPreferences, Message } from "@/data/schema";
import { toast } from "sonner";
import { useChat } from "@/hooks/useChat";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { ResetConversationButton } from "./ResetConversationButton";
import { Session } from "@supabase/supabase-js";
import { useChatData } from "@/hooks/useChatData";
import { LeftoversDialog } from "./LeftoversDialog";
import { supabase } from "@/integrations/supabase/client";
import { RotateCcw } from "lucide-react";

interface ChatbotProps {
  plan: MealPlan;
  setPlan: React.Dispatch<React.SetStateAction<MealPlan>>;
  isShoppingListOpen: boolean;
  setIsShoppingListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isLeftoversOpen: boolean;
  setIsLeftoversOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setThoughtSteps: React.Dispatch<React.SetStateAction<ThoughtStep[]>>;
  session?: Session | null;
  thoughtSteps: ThoughtStep[];
}

export const Chatbot = ({
  plan,
  setPlan,
  isShoppingListOpen,
  setIsShoppingListOpen,
  isLeftoversOpen,
  setIsLeftoversOpen,
  setThoughtSteps,
  session,
  thoughtSteps,
}: ChatbotProps) => {
  const [userSession, setUserSession] = useState<Session | null>(
    session || null
  );

  useEffect(() => {
    if (session) setUserSession(session);
  }, [session]);

  const chatData = useChatData(userSession, plan.plan_id);

  const {
    messages,
    inputValue,
    setInputValue,
    isThinking,
    handleSendMessage,
    resetConversation,
  } = useChat({
    setPlan,
    setIsShoppingListOpen,
    setThoughtSteps,
    onUpdateShoppingList: (newList: ShoppingListItem[]) => {
      chatData.shoppingList.saveList(newList);
    },
    onAddItemsToShoppingList: async (items) => {
      await chatData.shoppingList.addItems(items);
      toast.success("I've updated your shopping list.");
    },
    onRemoveItemsFromShoppingList: async (itemNames) => {
      await chatData.shoppingList.removeItems(itemNames);
      toast.success("I've removed the items from your shopping list.");
    },
    shoppingListItems: chatData.shoppingList.items,
    onUpdateInventory: async (items) => {
      // Debug statement to help diagnose inventory update issues
      console.log("[Chatbot] onUpdateInventory called with items:", items);
      for (const item of items) {
        await chatData.inventory.upsertItem({
          ...item,
          location: item.location || 'pantry',
          notes: item.notes || 'Added by AI',
        });
      }
      // Confirm in console after bulk update
      console.log("[Chatbot] Finished updating inventory via chat.");
      toast.success("Your inventory has been updated.");
    },
    onGetInventory: async () => {
      return chatData.inventory.items;
    },
    onGetUserPreferences: async () => {
      return chatData.preferences.data;
    },
    onUpdateUserPreferences: async (updates) => {
      await chatData.preferences.update(updates as Partial<UserPreferences>);
    },
    setIsLeftoversOpen,
    onGetLeftovers: async () => {
      await chatData.leftovers.get();
      const { data } = await supabase.from('user_leftovers').select('*').order('date_created', { ascending: false });
      return data || [];
    },
    onAddLeftover: async (item) => {
      await chatData.leftovers.add(item);
    },
    onUpdateLeftover: async (id, updates) => {
      await chatData.leftovers.update(id, updates);
    },
    onRemoveLeftover: async (id) => {
      await chatData.leftovers.remove(id);
    },
    session: userSession,
    thoughtSteps,
  });

  return (
    <div className="h-screen flex flex-col relative">
      {/* Icon-only Reset button on the left edge in chat panel */}
      <button
        onClick={resetConversation}
        title="Reset Chat"
        className="absolute left-2 top-4 z-20 w-8 h-8 flex items-center justify-center bg-background border border-border rounded-full transition hover:bg-accent"
        aria-label="Reset Chat"
      >
        <RotateCcw className="w-5 h-5" />
      </button>
      <Dialog open={isShoppingListOpen} onOpenChange={setIsShoppingListOpen}>
        <Card className="flex flex-col h-full shadow-none border-0 rounded-2xl">
          <ChatHeader onResetConversation={resetConversation} />
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden pb-20">
            <ChatMessageList messages={messages} isThinking={isThinking} />
          </CardContent>
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border rounded-t-2xl">
            <ChatInput
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleSendMessage={handleSendMessage}
              isThinking={isThinking}
            />
          </div>
        </Card>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Shopping List</DialogTitle>
            <DialogDescription className="sr-only">
              A dialog showing your current shopping list.
            </DialogDescription>
          </DialogHeader>
          <ShoppingList
            items={chatData.shoppingList.items}
            isLoading={chatData.shoppingList.isLoading}
            onRemove={chatData.shoppingList.removeItem}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isLeftoversOpen} onOpenChange={setIsLeftoversOpen}>
        <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="sr-only">Leftovers</DialogTitle>
              <DialogDescription className="sr-only">
                A dialog to view and manage your leftovers.
              </DialogDescription>
            </DialogHeader>
            <LeftoversDialog 
                items={chatData.leftovers.items}
                isLoading={chatData.leftovers.isLoading}
                onRemove={chatData.leftovers.remove}
                onUpdateServings={(id, servings) => {
                  if (servings === 0) {
                    chatData.leftovers.remove(id);
                    toast.info("Leftover removed as servings reached 0.");
                  } else {
                    chatData.leftovers.update(id, { servings });
                  }
                }}
            />
        </DialogContent>
      </Dialog>
    </div>
  );
};
