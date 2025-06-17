
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send } from "lucide-react";

interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => Promise<void>;
  isThinking: boolean;
}

export const ChatInput = ({ inputValue, setInputValue, handleSendMessage, isThinking }: ChatInputProps) => {
  return (
    <div className="p-4">
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Input 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          placeholder="Message Mise..." 
          disabled={isThinking} 
        />
        <Button type="submit" size="icon" disabled={isThinking}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};
