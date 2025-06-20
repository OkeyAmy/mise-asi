
import { useState, useEffect, useRef } from "react";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { ChatHeader } from "./ChatHeader";
import { ShoppingList } from "./ShoppingList";
import { LeftoversDialog } from "./LeftoversDialog";
import { MealPlan } from "./MealPlan";
import { useChat } from "@/hooks/useChat";
import { MealPlan as MealPlanType, ThoughtStep } from "@/data/schema";
import { Session } from "@supabase/supabase-js";
import { AmazonProductView } from "./AmazonProductView";

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

  const {
    messages,
    inputValue,
    setInputValue,
    isThinking,
    handleSendMessage,
    resetConversation,
  } = useChat({
    plan,
    setPlan,
    isShoppingListOpen,
    setIsShoppingListOpen,
    isLeftoversOpen,
    setIsLeftoversOpen,
    isAmazonProductViewOpen,
    setIsAmazonProductViewOpen,
    setThoughtSteps,
    session,
    thoughtSteps,
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

  return (
    <div className="flex flex-col h-full bg-background">
      <ChatHeader onReset={resetConversation} />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden">
            <ChatMessageList 
              messages={messages} 
              isThinking={isThinking} 
              thoughtSteps={thoughtSteps}
            />
            <div ref={messagesEndRef} />
          </div>
          
          <div className="flex-shrink-0 p-4 border-t border-border">
            <ChatInput
              inputValue={inputValue}
              setInputValue={setInputValue}
              onSendMessage={handleSendMessage}
              isThinking={isThinking}
            />
          </div>
        </div>

        <div className="hidden lg:block w-80 border-l border-border flex-shrink-0">
          <MealPlan plan={plan} />
        </div>
      </div>

      <ShoppingList
        isOpen={isShoppingListOpen}
        onClose={() => setIsShoppingListOpen(false)}
        session={session}
      />

      <LeftoversDialog
        isOpen={isLeftoversOpen}
        onClose={() => setIsLeftoversOpen(false)}
        session={session}
      />

      <AmazonProductView
        isOpen={isAmazonProductViewOpen}
        onClose={() => setIsAmazonProductViewOpen(false)}
        session={session}
      />
    </div>
  );
};
