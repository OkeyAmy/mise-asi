
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Bot, Send, ShoppingCart, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { ShoppingList } from "./ShoppingList";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { MealPlan, ShoppingListItem } from "@/data/schema";
import { callGemini } from "@/lib/gemini";
import { ApiKeyDialog } from "./ApiKeyDialog";
import { toast } from "sonner";
import { Content, Part } from "@google/generative-ai";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  showShoppingListButton?: boolean;
}

interface ChatbotProps {
  plan: MealPlan;
  setPlan: React.Dispatch<React.SetStateAction<MealPlan>>;
}

const initialMessages: Message[] = [
  { id: 1, text: "Welcome to NutriMate! To get started, tell me about your eating habits, any restrictions, and your nutrition goals. You can also tell me what ingredients you have in your pantry.", sender: "bot" }
];

export const Chatbot = ({ plan, setPlan }: ChatbotProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    const storedApiKey = localStorage.getItem("gemini_api_key");
    if (storedApiKey) {
      setApiKey(storedApiKey);
    } else {
      setTimeout(() => setIsApiKeyDialogOpen(true), 500);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem("gemini_api_key", key);
    setApiKey(key);
    setIsApiKeyDialogOpen(false);
    toast.success("API Key saved successfully!");
  };

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;

    if (!apiKey) {
      setIsApiKeyDialogOpen(true);
      toast.error("Please set your Gemini API key first.");
      return;
    }

    const userInput = inputValue.trim();
    const userMessage: Message = { id: Date.now(), text: userInput, sender: "user" };
    
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsThinking(true);

    try {
        const history: Content[] = newMessages.map(msg => ({
            role: msg.sender === 'bot' ? 'model' : 'user',
            parts: [{ text: msg.text }],
        }));

        const result = await callGemini(apiKey, history);
        const response = result.response;
        const functionCalls = response.functionCalls();

        if (functionCalls) {
            const call = functionCalls[0];
            if (call.name === 'updateMealPlan' && call.args.newPlan) {
                const newPlan = call.args.newPlan as MealPlan;
                setPlan(newPlan);
                
                const functionResponsePart: Part = {
                    functionResponse: {
                        name: 'updateMealPlan',
                        response: { success: true, message: "Meal plan updated successfully." }
                    }
                };

                const historyWithFunctionCall: Content[] = [
                    ...history,
                    { role: 'model', parts: [{ functionCall: call }] },
                    { role: 'user', parts: [functionResponsePart] }
                ];
                
                const finalResult = await callGemini(apiKey, historyWithFunctionCall);
                const finalText = finalResult.response.text();
                const botMessage: Message = { id: Date.now() + 1, text: finalText, sender: "bot" };
                setMessages(prev => [...prev, botMessage]);

            }
        } else {
            const botResponseText = response.text();
            const shouldShowButton = userInput.toLowerCase().includes("shopping list");
            if (shouldShowButton) {
                setIsShoppingListOpen(true);
            }
            const botMessage: Message = { 
                id: Date.now() + 1, 
                text: botResponseText, 
                sender: "bot",
                showShoppingListButton: shouldShowButton 
            };
            setMessages(prev => [...prev, botMessage]);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast.error(errorMessage);
        // Remove the user message if the call fails
        setMessages(messages);
    } finally {
        setIsThinking(false);
    }
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
        <ApiKeyDialog 
            isOpen={isApiKeyDialogOpen}
            onClose={() => setIsApiKeyDialogOpen(false)}
            onSave={handleSaveApiKey}
        />
        <Dialog open={isShoppingListOpen} onOpenChange={setIsShoppingListOpen}>
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
                            {message.showShoppingListButton && (
                                <DialogTrigger asChild>
                                <Button size="sm" className="mt-2 w-full"><ShoppingCart className="mr-2 h-4 w-4"/> View Shopping List</Button>
                                </DialogTrigger>
                            )}
                            </div>
                            {message.sender === 'user' && <Avatar className="h-8 w-8"><AvatarFallback><User className="h-4 w-4"/></AvatarFallback></Avatar>}
                        </div>
                        ))}
                        {isThinking && (
                            <div className="flex items-end gap-2 justify-start">
                                <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-4 w-4"/></AvatarFallback></Avatar>
                                <div className="max-w-[75%] rounded-lg p-3 text-sm bg-muted rounded-bl-none">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse"></div>
                                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.2s]"></div>
                                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.4s]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Message NutriMate..." disabled={isThinking} />
                    <Button type="submit" size="icon" disabled={isThinking}><Send className="h-4 w-4" /></Button>
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
