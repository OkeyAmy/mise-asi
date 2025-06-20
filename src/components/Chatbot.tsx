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

  console.log("🔐 Chatbot userSession:", userSession?.user?.id);
  console.log("📋 Chatbot plan.plan_id:", plan.plan_id);
  console.log("🛒 chatData.shoppingList available:", !!chatData.shoppingList);
  console.log("🛒 chatData.shoppingList.removeItems available:", !!chatData.shoppingList?.removeItems);

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
      console.log("🔧 onRemoveItemsFromShoppingList callback called with:", itemNames);
      console.log("📋 chatData.shoppingList.removeItems function available:", !!chatData.shoppingList.removeItems);
      try {
        await chatData.shoppingList.removeItems(itemNames);
        console.log("✅ chatData.shoppingList.removeItems completed successfully");
        toast.success("I've removed the items from your shopping list.");
      } catch (error) {
        console.error("❌ Error in onRemoveItemsFromShoppingList:", error);
        toast.error("Failed to remove items from shopping list.");
      }
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
    
    // CRUD Inventory callbacks
    onCreateInventoryItems: async (items) => {
      console.log("🔧 onCreateInventoryItems called with:", items);
      for (const item of items) {
        try {
          const result = await chatData.inventory.upsertItem({
            ...item,
            location: item.location || 'pantry',
            notes: item.notes || 'Added by AI',
          });
          console.log("✅ Inventory create result:", result);
        } catch (e) {
          console.error("❌ Inventory create failed for item:", item, e);
        }
      }
      toast.success("Your inventory has been updated.");
    },
    onUpdateInventoryItem: async (itemId, updates) => {
      console.log("🔧 onUpdateInventoryItem called with:", { itemId, updates });
      try {
        const result = await chatData.inventory.updateItem(itemId, updates);
        console.log("✅ Inventory update result:", result);
        toast.success("Inventory item updated.");
      } catch (e) {
        console.error("❌ Inventory update failed:", e);
        toast.error("Failed to update inventory item.");
      }
    },
    onDeleteInventoryItem: async (itemId) => {
      console.log("🔧 onDeleteInventoryItem called with:", itemId);
      try {
        const result = await chatData.inventory.deleteItem(itemId);
        console.log("✅ Inventory delete result:", result);
        toast.success("Inventory item deleted.");
      } catch (e) {
        console.error("❌ Inventory delete failed:", e);
        toast.error("Failed to delete inventory item.");
      }
    },
    
    // CRUD Shopping List callbacks
    onGetShoppingListItems: async () => {
      console.log("🔧 onGetShoppingListItems called");
      const items = chatData.shoppingList.items;
      console.log("📋 Shopping list items:", items);
      return items;
    },
    onCreateShoppingListItems: async (items) => {
      console.log("🔧 onCreateShoppingListItems called with:", items);
      await chatData.shoppingList.addItems(items);
      toast.success("Items added to shopping list.");
    },
    onUpdateShoppingListItem: async (itemName, updates) => {
      console.log("🔧 onUpdateShoppingListItem called with:", { itemName, updates });
      // Find item and update it by replacing the entire list
      const currentItems = chatData.shoppingList.items;
      const updatedItems = currentItems.map(item => {
        if (item.item.toLowerCase() === itemName.toLowerCase()) {
          return {
            ...item,
            quantity: updates.quantity !== undefined ? updates.quantity : item.quantity,
            unit: updates.unit !== undefined ? updates.unit : item.unit
          };
        }
        return item;
      });
      await chatData.shoppingList.saveList(updatedItems);
      toast.success("Shopping list updated.");
    },
    onDeleteShoppingListItems: async (itemNames) => {
      console.log("🔧 onDeleteShoppingListItems called with:", itemNames);
      await chatData.shoppingList.removeItems(itemNames);
      toast.success("Items removed from shopping list.");
    },
    onReplaceShoppingList: async (items) => {
      console.log("🔧 onReplaceShoppingList called with:", items);
      await chatData.shoppingList.saveList(items);
      if (items.length === 0) {
        toast.success("Shopping list cleared.");
      } else {
        toast.success("Shopping list replaced.");
      }
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
    
    // CRUD Leftovers callbacks - using legacy handlers as fallback
    onCreateLeftoverItems: async (items) => {
      console.log("🔧 onCreateLeftoverItems called with:", items);
      for (const item of items) {
        await chatData.leftovers.add(item);
      }
      toast.success("Leftover items added.");
    },
    onUpdateLeftoverItemPartial: async (leftoverId, updates) => {
      console.log("🔧 onUpdateLeftoverItemPartial called with:", { leftoverId, updates });
      await chatData.leftovers.update(leftoverId, updates);
      toast.success("Leftover item updated.");
    },
    onDeleteLeftoverItem: async (leftoverId) => {
      console.log("🔧 onDeleteLeftoverItem called with:", leftoverId);
      await chatData.leftovers.remove(leftoverId);
      toast.success("Leftover item deleted.");
    },
    
    session: userSession,
    thoughtSteps,
  });

  return (
    <div className="h-full flex flex-col relative">
      {/* Main chat container with fixed layout */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Scrollable chat messages area */}
        <div className="flex-1 min-h-0 relative chat-messages-area">
          <Card className="h-full shadow-none border-0 rounded-2xl rounded-b-none chat-layout-transition">
            <CardContent className="h-full p-0 flex flex-col">
            <ChatMessageList messages={messages} isThinking={isThinking} />
          </CardContent>
          </Card>
        </div>
        
        {/* Visual separator */}
        <div className="chat-input-separator"></div>
        
        {/* Fixed input area at bottom */}
        <div className="flex-shrink-0 chat-input-fixed rounded-b-2xl">
          <div className="flex items-center p-1">
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
        </div>
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
            onUpdate={async (itemName: string, quantity: number, unit: string) => {
              await chatData.shoppingList.updateItem(itemName, quantity, unit);
              toast.success("Shopping list updated.");
            }}
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
