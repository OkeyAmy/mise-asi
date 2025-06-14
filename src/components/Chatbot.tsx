
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Bot, Send, ShoppingCart, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { ShoppingList } from "./ShoppingList";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { MealPlan, ShoppingListItem } from "@/data/schema";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

interface ChatbotProps {
  plan: MealPlan;
}

const initialMessages: Message[] = [
  { id: 1, text: "Welcome to NutriMate! To get started, tell me about your eating habits, any restrictions, and your nutrition goals. You can also tell me what ingredients you have in your pantry.", sender: "bot" }
];

export const Chatbot = ({ plan }: ChatbotProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);

  const generateShoppingList = (): ShoppingListItem[] => {
    const allIngredients = new Map<string, ShoppingListItem>();
    plan.days.forEach(day => {
      Object.values(day.meals).forEach(meal => {
        meal.ingredients.forEach(ing => {
          if (allIngredients.has(ing.item)) {
            const existing = allIngredients.get(ing.item)!;
            existing.quantity += ing.quantity;
          } else {
            allIngredients.set(ing.item, { ...ing });
          }
        });
      });
    });
    return Array.from(allIngredients.values());
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = { id: Date.now(), text: inputValue, sender: "user" };
    setMessages(prev => [...prev, userMessage]);

    // Mock bot response
    setTimeout(() => {
      let botResponseText = "I'm not sure how to help with that. Try asking about your 'goals', 'pantry', or 'shopping list'.";
      if (inputValue.toLowerCase().includes("goal")) {
        botResponseText = "Great! Your goals have been updated. I'm regenerating your meal plan now to reflect the changes. ✨";
      } else if (inputValue.toLowerCase().includes("pantry") || inputValue.toLowerCase().includes("have")) {
        botResponseText = "Thanks for updating your pantry! I'll prioritize these ingredients in your next meal plan to reduce waste.";
      } else if (inputValue.toLowerCase().includes("shopping list")) {
        botResponseText = "Of course! Here is your shopping list. I've only included items you don't have in your pantry.";
        setIsShoppingListOpen(true);
      }
      
      const botMessage: Message = { id: Date.now() + 1, text: botResponseText, sender: "bot" };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
    
    setInputValue("");
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="fixed bottom-4 right-4 h-16 w-16 rounded-full shadow-lg z-50">
        <Bot className="h-8 w-8" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-sm z-50 animate-bubble-in">
        <Dialog>
            <Card className="flex flex-col h-[600px] shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
                    </Avatar>
                    <CardTitle>NutriMate AI</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}><X className="h-4 w-4"/></Button>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-4">
                        {messages.map((message) => (
                        <div key={message.id} className={cn("flex items-end gap-2", message.sender === "user" ? "justify-end" : "justify-start")}>
                            {message.sender === 'bot' && <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-4 w-4"/></AvatarFallback></Avatar>}
                            <div className={cn("max-w-[75%] rounded-lg p-3 text-sm", message.sender === "user" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none")}>
                            {message.text}
                            {message.text.includes("shopping list") && (
                                <DialogTrigger asChild>
                                <Button size="sm" className="mt-2 w-full"><ShoppingCart className="mr-2 h-4 w-4"/> View Shopping List</Button>
                                </DialogTrigger>
                            )}
                            </div>
                            {message.sender === 'user' && <Avatar className="h-8 w-8"><AvatarFallback><User className="h-4 w-4"/></AvatarFallback></Avatar>}
                        </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Message NutriMate..." />
                    <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
                  </form>
                </div>
              </CardContent>
            </Card>
            <DialogContent className="max-w-md">
                <ShoppingList items={generateShoppingList()} />
            </DialogContent>
        </Dialog>
    </div>
  );
};
