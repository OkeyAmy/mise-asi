import { useState, useEffect, useRef } from "react";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { ShoppingList } from "./ShoppingList";
import { LeftoversDialog } from "./LeftoversDialog";
import { useChat } from "@/hooks/useChat";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useLeftovers } from "@/hooks/useLeftovers";
import { useInventory, InventoryItem } from "@/hooks/useInventory";
import { usePreferences } from "@/hooks/usePreferences";
import { ThoughtStep, LeftoverItem, UserPreferences } from "@/data/schema";
import { Session } from "@supabase/supabase-js";
import { AmazonProductView } from "./AmazonProductView";
import { Button } from "./ui/button";
import { ShoppingCart, Package, Utensils, LogOut, Menu, Plus, Send, ChevronDown } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface MobileChatInterfaceProps {
  isShoppingListOpen: boolean;
  setIsShoppingListOpen: (open: boolean) => void;
  isLeftoversOpen: boolean;
  setIsLeftoversOpen: (open: boolean) => void;
  setThoughtSteps: (steps: ThoughtStep[] | ((prev: ThoughtStep[]) => ThoughtStep[])) => void;
  session: Session | null;
  thoughtSteps: ThoughtStep[];
  pendingMessage?: string | null;
  onMessageSent?: () => void;
}

export const MobileChatInterface = ({
  isShoppingListOpen,
  setIsShoppingListOpen,
  isLeftoversOpen,
  setIsLeftoversOpen,
  setThoughtSteps,
  session,
  thoughtSteps,
  pendingMessage,
  onMessageSent,
}: MobileChatInterfaceProps) => {
  const [isAmazonProductViewOpen, setIsAmazonProductViewOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const {
    items: shoppingListItems,
    addItems: addShoppingListItems,
    removeItems: removeShoppingListItems,
    updateItem: updateShoppingListItem,
    removeItem: removeShoppingListItem,
    saveList: replaceShoppingList,
  } = useShoppingList(session, "default");

  const {
    items: leftoverItems,
    isLoading: leftoverLoading,
    addLeftover,
    updateLeftover,
    removeLeftover,
  } = useLeftovers(session);

  const {
    items: inventoryItems,
    addItem: createInventoryItem,
    updateItem: updateInventoryItemFromHook,
    deleteItem: deleteInventoryItemFromHook,
    upsertItem,
  } = useInventory(session);
  
  const { preferences, updatePreferences } = usePreferences(session);

  const onCreateInventoryItems = async (items: Omit<InventoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => {
    for (const item of items) {
      await createInventoryItem(item);
    }
  };

  const onUpdateInventory = async (items: Partial<Omit<InventoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & { item_name: string }[]) => {
    for (const item of items) {
      await upsertItem(item);
    }
  };
  
  const onUpdateInventoryItem = async (itemId: string, updates: Partial<InventoryItem>) => {
    await updateInventoryItemFromHook(itemId, updates);
  };
  
  const onDeleteInventoryItem = async (itemId: string) => {
    await deleteInventoryItemFromHook(itemId);
  };

  const onCreateLeftoverItems = async (items: Omit<LeftoverItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => {
    for (const item of items) {
      await addLeftover(item);
    }
  };

  const onUpdateLeftoverItemPartial = async (leftoverId: string, updates: Partial<{ meal_name: string; servings: number; notes: string }>) => {
    await updateLeftover(leftoverId, updates);
  };

  const onDeleteLeftoverItem = async (leftoverId: string) => {
    await removeLeftover(leftoverId);
  };

  const onUpdateShoppingListItemCrud = async (itemName: string, updates: { quantity?: number; unit?: string }) => {
    await updateShoppingListItem(itemName, updates.quantity, updates.unit);
  };

  const {
    messages,
    inputValue,
    setInputValue,
    isThinking,
    handleSendMessage,
    resetConversation,
  } = useChat({
    setPlan: () => {},
    setIsShoppingListOpen,
    setIsLeftoversOpen,
    setThoughtSteps,
    session,
    thoughtSteps,
    shoppingListItems,
    onAddItemsToShoppingList: addShoppingListItems,
    onRemoveItemsFromShoppingList: removeShoppingListItems,
    onGetLeftovers: async () => leftoverItems,
    onAddLeftover: addLeftover,
    onUpdateLeftover: updateLeftover,
    onRemoveLeftover: removeLeftover,
    onGetInventory: async () => inventoryItems,
    onCreateInventoryItems,
    onUpdateInventory,
    onUpdateInventoryItem,
    onDeleteInventoryItem,
    onGetUserPreferences: async () => preferences,
    onUpdateUserPreferences: updatePreferences,
    onGetShoppingListItems: async () => shoppingListItems,
    onCreateShoppingListItems: addShoppingListItems,
    onUpdateShoppingListItem: onUpdateShoppingListItemCrud,
    onDeleteShoppingListItems: removeShoppingListItems,
    onReplaceShoppingList: replaceShoppingList,
    onCreateLeftoverItems,
    onUpdateLeftoverItemPartial,
    onDeleteLeftoverItem,
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (pendingMessage && !isThinking) {
      setInputValue(pendingMessage);
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          onMessageSent?.();
        }
      }, 500);
    }
  }, [pendingMessage, isThinking, setInputValue, onMessageSent]);

  const handleUpdateLeftoverServings = (id: string, servings: number) => {
    updateLeftover(id, { servings });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSendMessageWithForm = (e: React.FormEvent) => {
    handleSendMessage(e);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Mobile Header with Dropdown */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-glass-border/30">
        <div className="flex justify-between items-center p-4">
          {/* Logo/Brand */}
          <div className="text-lg font-semibold text-foreground">
            Mise
          </div>

          {/* Menu Button */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="glass-pill p-2"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 glass-card border border-glass-border/50"
            >
              <DropdownMenuItem 
                onClick={() => {
                  setIsShoppingListOpen(true);
                  setIsDropdownOpen(false);
                }}
                className="flex items-center gap-3 p-3"
              >
                <ShoppingCart className="w-4 h-4" />
                Shopping
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  navigate('/inventory');
                  setIsDropdownOpen(false);
                }}
                className="flex items-center gap-3 p-3"
              >
                <Package className="w-4 h-4" />
                Inventory
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setIsLeftoversOpen(true);
                  setIsDropdownOpen(false);
                }}
                className="flex items-center gap-3 p-3"
              >
                <Utensils className="w-4 h-4" />
                Leftovers
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  handleLogout();
                  setIsDropdownOpen(false);
                }}
                className="flex items-center gap-3 p-3 text-red-500 hover:text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Chat Content */}
      <div className="flex-1 flex flex-col pt-20 pb-20">
        <div className="flex-1 overflow-hidden">
          <ChatMessageList 
            messages={messages} 
            isThinking={isThinking}
          />
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Mobile Input Area */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-glass-border/30 p-4">
        <form onSubmit={handleSendMessageWithForm} className="flex items-center gap-3">
          {/* Plus Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="glass-pill p-3 flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
          </Button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything"
              className="w-full px-4 py-3 rounded-2xl glass-card border border-glass-border/50 bg-glass-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isThinking}
            />
          </div>

          {/* Send Button */}
          <Button
            type="submit"
            disabled={!inputValue.trim() || isThinking}
            variant="ghost"
            size="sm"
            className="glass-pill p-3 flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>

      {/* Dialogs */}
      <Dialog open={isShoppingListOpen} onOpenChange={setIsShoppingListOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shopping List</DialogTitle>
          </DialogHeader>
          <ShoppingList
            items={shoppingListItems || []}
            onRemove={removeShoppingListItem}
            onUpdate={updateShoppingListItem}
            onAdd={addShoppingListItems}
            session={session}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isLeftoversOpen} onOpenChange={setIsLeftoversOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Leftovers</DialogTitle>
          </DialogHeader>
          <LeftoversDialog
            items={leftoverItems || []}
            isLoading={leftoverLoading}
            onRemove={removeLeftover}
            onUpdateServings={handleUpdateLeftoverServings}
            onAdd={addLeftover}
          />
        </DialogContent>
      </Dialog>

      <AmazonProductView
        isOpen={isAmazonProductViewOpen}
        onClose={() => setIsAmazonProductViewOpen(false)}
        productName=""
      />
    </div>
  );
};