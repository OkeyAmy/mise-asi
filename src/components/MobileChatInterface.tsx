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
import { ChevronDown, Check, MessageSquare, BookOpen, Zap } from "lucide-react";
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
import { Button } from "./ui/button";

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

const chatModes = [
  {
    id: "mise-3",
    name: "Mise 3",
    description: "Fast",
    icon: Zap,
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "mise-4",
    name: "Mise 4", 
    description: "Expert",
    icon: MessageSquare,
    color: "from-purple-500 to-pink-500"
  },
  {
    id: "mise-4-heavy",
    name: "Mise 4 Heavy",
    description: "Group of Experts",
    icon: BookOpen,
    color: "from-orange-500 to-red-500"
  }
];

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
  const [selectedMode, setSelectedMode] = useState(chatModes[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Mobile Chat Mode Selector */}
      <div className="flex-shrink-0 p-4 border-b border-border/30">
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between glass-medium rounded-2xl p-4 h-auto"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${selectedMode.color} flex items-center justify-center`}>
                  <selectedMode.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-base font-semibold text-foreground">{selectedMode.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedMode.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 glass-strong border-glass-border/30 rounded-2xl p-2" align="center">
            {chatModes.map((mode) => (
              <DropdownMenuItem
                key={mode.id}
                onSelect={() => {
                  setSelectedMode(mode);
                  setIsDropdownOpen(false);
                }}
                className="rounded-xl p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${mode.color} flex items-center justify-center`}>
                    <mode.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{mode.name}</div>
                    <div className="text-xs text-muted-foreground">{mode.description}</div>
                  </div>
                  {selectedMode.id === mode.id && (
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            
            {/* SuperMise Upgrade Section */}
            <div className="mt-2 p-3 glass-light rounded-xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-orange-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">SuperMise</div>
                  <div className="text-xs text-muted-foreground">Unlock advanced features</div>
                </div>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-full px-4 text-xs">
                  Upgrade
                </Button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden">
            <ChatMessageList 
              messages={messages} 
              isThinking={isThinking}
            />
            <div ref={messagesEndRef} />
          </div>
          
          <div className="flex-shrink-0 border-t border-border">
            <ChatInput
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleSendMessage={handleSendMessage}
              isThinking={isThinking}
              onResetConversation={resetConversation}
            />
          </div>
        </div>
      </div>

      <Dialog open={isShoppingListOpen} onOpenChange={setIsShoppingListOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto glass-modal">
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto glass-modal">
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