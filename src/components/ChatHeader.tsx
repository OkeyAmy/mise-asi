
import { ResetConversationButton } from "./ResetConversationButton";

interface ChatHeaderProps {
  onResetConversation: () => void;
}

export const ChatHeader = ({ onResetConversation }: ChatHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-semibold text-sm">N</span>
        </div>
        <div>
          <h2 className="font-semibold">NutriMate</h2>
          <p className="text-xs text-muted-foreground">Your AI nutrition assistant</p>
        </div>
      </div>
      <ResetConversationButton onReset={onResetConversation} />
    </div>
  );
};
