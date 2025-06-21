
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ResetConversationButton } from "./ResetConversationButton";

interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => Promise<void>;
  isThinking: boolean;
  onResetConversation: () => void;
}

export const ChatInput = ({ 
  inputValue, 
  setInputValue, 
  handleSendMessage, 
  isThinking,
  onResetConversation 
}: ChatInputProps) => {
  return (
    <div className="p-4">
      <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              type="button" 
              size="icon" 
              variant="outline"
              className="flex-shrink-0"
              disabled={isThinking}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem asChild>
              <div className="w-full">
                <ResetConversationButton 
                  onReset={onResetConversation}
                  iconOnly={false}
                  className="w-full justify-start h-auto p-2"
                />
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Input 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          placeholder="Type a message..." 
          disabled={isThinking}
          className="flex-1"
        />
        
        <Button 
          type="submit" 
          size="icon" 
          disabled={isThinking}
          className="flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};
