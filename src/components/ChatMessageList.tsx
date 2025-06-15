
import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

interface ChatMessageListProps {
  messages: Message[];
  isThinking: boolean;
}

export const ChatMessageList = ({ messages, isThinking }: ChatMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  return (
    <ScrollArea className="flex-1 p-6">
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={cn("flex items-end gap-2", message.sender === "user" ? "justify-end" : "justify-start")}>
            {message.sender === 'bot' && <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></AvatarFallback></Avatar>}
            <div className={cn("max-w-[75%] rounded-lg p-3 text-sm", message.sender === "user" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none")}>
              {message.sender === "bot" ? (
                <MarkdownRenderer content={message.text} />
              ) : (
                message.text
              )}
            </div>
            {message.sender === 'user' && <Avatar className="h-8 w-8"><AvatarFallback><User className="h-4 w-4" /></AvatarFallback></Avatar>}
          </div>
        ))}
        {isThinking && (
          <div className="flex items-end gap-2 justify-start">
            <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></AvatarFallback></Avatar>
            <div className="max-w-[75%] rounded-lg p-3 text-sm bg-muted rounded-bl-none">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
