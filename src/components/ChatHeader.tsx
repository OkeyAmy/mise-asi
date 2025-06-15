
import { ResetConversationButton } from "./ResetConversationButton";

interface ChatHeaderProps {
  onResetConversation: () => void;
}

// Removed the subheading and Reset button here as per new placement
export const ChatHeader = (_props: ChatHeaderProps) => {
  return (
    <div className="flex items-center p-4 border-b">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-semibold text-sm">M</span>
        </div>
        <div>
          <h2 className="font-semibold">Mise</h2>
        </div>
      </div>
    </div>
  );
};
