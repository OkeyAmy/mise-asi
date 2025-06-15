
import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { ShoppingList } from "./ShoppingList";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { MealPlan, ShoppingListItem, ThoughtStep, UserPreferences, Message } from "@/data/schema";
import { toast } from "sonner";
import { useChat } from "@/hooks/useChat";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { ResetConversationButton } from "./ResetConversationButton";
import { Session } from "@supabase/supabase-js";
import { useChatData } from "@/hooks/useChatData";
import { LeftoversDialog } from "./LeftoversDialog";
import { supabase } from "@/integrations/supabase/client";
import React from "react";

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
      // Add logging for troubleshooting inventory not updating
      console.log("onUpdateInventory called with:", items);
      for (const item of items) {
        try {
          const result = await chatData.inventory.upsertItem({
            ...item,
            location: item.location || 'pantry',
            notes: item.notes || 'Added by AI',
          });
          console.log("Inventory upsert result:", result);
        } catch (e) {
          console.error("Inventory upsert failed for item:", item, e);
        }
      }
      toast.success("Your inventory has been updated.");
    },
    onGetInventory: async () => {
      const items = chatData.inventory.items;
      console.log("onGetInventory, items:", items);
      return items;
    },
    onGetUserPreferences: async () => {
      return chatData.preferences.data;
    },
    onUpdateUserPreferences: async (updates) => {
      await chatData.preferences.update(updates as Partial<UserPreferences>);
    },
    setIsLeftoversOpen,
    onGetLeftovers: async () => {
      await chatData.leftovers.get(); // Refreshes the list
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
    <div className="h-full flex flex-col relative">
      {/* Chat content */}
      <div className="flex-1 flex flex-col min-h-0">
        <Card className="flex flex-col h-full shadow-none border-0 rounded-2xl overflow-hidden">
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ChatMessageList messages={messages} isThinking={isThinking} />
          </CardContent>
          {/* Chat input panel is now a flex item, constrained to the Card width */}
          <div className="bg-background border-t border-border rounded-t-2xl flex items-center">
            <div className="pl-2 pr-1">
              <ResetConversationButton onReset={resetConversation} iconOnly />
            </div>
            <div className="flex-1">
              <ChatInput
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleSendMessage={handleSendMessage}
                isThinking={isThinking}
              />
            </div>
          </div>
        </Card>
      </div>
      {/* Dialog: Shopping List */}
      <Dialog open={isShoppingListOpen} onOpenChange={setIsShoppingListOpen}>
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
      {/* Dialog: Leftovers */}
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
