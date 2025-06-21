
import { useState, useEffect, useRef } from "react";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { ChatHeader } from "./ChatHeader";
import { ShoppingList } from "./ShoppingList";
import { LeftoversDialog } from "./LeftoversDialog";
import { MealPlan } from "./MealPlan";
import { useChat } from "@/hooks/useChat";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useLeftovers } from "@/hooks/useLeftovers";
import { MealPlan as MealPlanType, ThoughtStep } from "@/data/schema";
import { Session } from "@supabase/supabase-js";
import { AmazonProductView } from "./AmazonProductView";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface ChatbotProps {
  plan: MealPlanType;
  setPlan: (plan: MealPlanType) => void;
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
  pendingMessage,
  onMessageSent,
}: ChatbotProps) => {
  const [isAmazonProductViewOpen, setIsAmazonProductViewOpen] = useState(false);

  const { items: shoppingListItems, removeItem, updateItem, addItems } = useShoppingList(session, "default");
  const { items: leftoverItems, isLoading: leftoverLoading, removeLeftover, updateLeftover, addLeftover } = useLeftovers(session);

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
    setIsLeftoversOpen,
    setThoughtSteps,
    session,
    thoughtSteps,
    onGetLeftovers: async () => leftoverItems || [],
    onAddLeftover: addLeftover,
    onUpdateLeftover: updateLeftover,
    onRemoveLeftover: removeLeftover,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle pending message from shared shopping list
  useEffect(() => {
    if (pendingMessage && !isThinking) {
      setInputValue(pendingMessage);
      // Auto-submit the message after a short delay
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

  const handleRemoveShoppingItem = (itemName: string) => {
    removeItem(itemName);
  };

  const handleUpdateShoppingItem = (itemName: string, updates: Partial<ShoppingListItem>) => {
    if (updates.quantity !== undefined && updates.unit !== undefined) {
      updateItem(itemName, updates.quantity, updates.unit);
    } else if (updates.quantity !== undefined) {
      updateItem(itemName, updates.quantity);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <ChatHeader onResetConversation={resetConversation} />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden">
            <ChatMessageList 
              messages={messages} 
              isThinking={isThinking}
            />
            <div ref={messagesEndRef} />
          </div>
          
          <div className="flex-shrink-0 p-4 border-t border-border">
            <ChatInput
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleSendMessage={handleSendMessage}
              isThinking={isThinking}
            />
          </div>
        </div>

        <div className="hidden lg:block w-80 border-l border-border flex-shrink-0">
          <MealPlan plan={plan} />
        </div>
      </div>

      <Dialog open={isShoppingListOpen} onOpenChange={setIsShoppingListOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shopping List</DialogTitle>
          </DialogHeader>
          <ShoppingList
            items={shoppingListItems || []}
            onRemove={handleRemoveShoppingItem}
            onUpdate={handleUpdateShoppingItem}
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
