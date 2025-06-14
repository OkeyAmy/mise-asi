
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Bot, Send, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { ShoppingList } from "./ShoppingList";
import { Dialog, DialogContent } from "./ui/dialog";
import { MealPlan, ShoppingListItem, ThoughtStep } from "@/data/schema";
import { callGemini } from "@/lib/gemini";
import { ApiKeyDialog } from "./ApiKeyDialog";
import { toast } from "sonner";
import { Content, FunctionCall } from "@google/generative-ai";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

interface ChatbotProps {
  plan: MealPlan;
  setPlan: React.Dispatch<React.SetStateAction<MealPlan>>;
  isShoppingListOpen: boolean;
  setIsShoppingListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  thoughtSteps: ThoughtStep[];
  setThoughtSteps: React.Dispatch<React.SetStateAction<ThoughtStep[]>>;
}

const initialMessages: Message[] = [
  { id: 1, text: "Welcome to NutriMate! To get started, tell me about your eating habits, any restrictions, and your nutrition goals. You can also tell me what ingredients you have in your pantry.", sender: "bot" }
];

export const Chatbot = ({ plan, setPlan, isShoppingListOpen, setIsShoppingListOpen, thoughtSteps, setThoughtSteps }: ChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    let storedApiKey = localStorage.getItem("gemini_api_key");
    if (!storedApiKey) {
      storedApiKey = "AIzaSyB6j2kGAu88UqOhVNN8KSbUjijlXMfdovY";
      localStorage.setItem("gemini_api_key", storedApiKey);
      toast.info("A default API key has been configured.");
    }
    setApiKey(storedApiKey);
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

  const addThoughtStep = (step: string, details?: string) => {
    const newStep: ThoughtStep = {
      id: Date.now().toString(),
      step,
      status: 'active',
      details
    };
    setThoughtSteps(prev => [...prev, newStep]);
    return newStep.id;
  };

  const updateThoughtStep = (id: string, status: 'pending' | 'active' | 'completed', details?: string) => {
    setThoughtSteps(prev => prev.map(step => 
      step.id === id ? { ...step, status, details } : step
    ));
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

    // Clear previous thought steps
    setThoughtSteps([]);

    try {
        const step1Id = addThoughtStep("Understanding user request", userInput);
        updateThoughtStep(step1Id, 'completed');

        const step2Id = addThoughtStep("Analyzing available tools", "Checking updateMealPlan and showShoppingList functions");
        
        const history: Content[] = newMessages.map(msg => ({
            role: msg.sender === 'bot' ? 'model' : 'user',
            parts: [{ text: msg.text }],
        }));

        updateThoughtStep(step2Id, 'completed');
        const step3Id = addThoughtStep("Generating AI response", "Processing with Gemini AI");

        const response = await callGemini(apiKey, history);
        const functionCalls = response.candidates?.[0]?.content.parts
            .map(p => p.functionCall)
            .filter((fc): fc is FunctionCall => !!fc);

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            updateThoughtStep(step3Id, 'completed');
            
            if (call.name === 'updateMealPlan') {
                const step4Id = addThoughtStep("Updating meal plan", "Applying new 7-day meal plan");
                const newPlan = call.args as MealPlan;
                setPlan(newPlan);
                updateThoughtStep(step4Id, 'completed');
            } else if (call.name === 'showShoppingList') {
                const step4Id = addThoughtStep("Showing shopping list", "Opening shopping list dialog");
                setIsShoppingListOpen(true);
                updateThoughtStep(step4Id, 'completed');
            }

            const step5Id = addThoughtStep("Generating final response", "Creating user-friendly message");
            
            const functionResponsePart = {
                functionResponse: {
                    name: call.name,
                    response: { success: true, message: `${call.name} executed successfully.` }
                }
            };

            const historyWithFunctionCall: Content[] = [
                ...history,
                { role: 'model', parts: [{ functionCall: call }] },
                { role: 'user', parts: [functionResponsePart] }
            ];
            
            const finalResultResponse = await callGemini(apiKey, historyWithFunctionCall);
            const finalText = finalResultResponse.candidates?.[0]?.content.parts.map(p => p.text).join('') ?? '';
            const botMessage: Message = { id: Date.now() + 1, text: finalText, sender: "bot" };
            setMessages(prev => [...prev, botMessage]);
            updateThoughtStep(step5Id, 'completed');
        } else {
            const botResponseText = response.candidates?.[0]?.content.parts.map(p => p.text).join('') ?? '';
            const botMessage: Message = { 
                id: Date.now() + 1, 
                text: botResponseText, 
                sender: "bot",
            };
            setMessages(prev => [...prev, botMessage]);
            updateThoughtStep(step3Id, 'completed');
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast.error(errorMessage);
        setMessages(messages);
        addThoughtStep("Error occurred", errorMessage);
    } finally {
        setIsThinking(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
        <ApiKeyDialog 
            isOpen={isApiKeyDialogOpen}
            onClose={() => setIsApiKeyDialogOpen(false)}
            onSave={handleSaveApiKey}
        />
        <Dialog open={isShoppingListOpen} onOpenChange={setIsShoppingListOpen}>
            <Card className="flex flex-col h-full shadow-none border-0">
              <CardHeader className="flex flex-row items-center justify-between border-b">
                <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
                    </Avatar>
                    <CardTitle>NutriMate AI</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-4">
                        {messages.map((message) => (
                        <div key={message.id} className={cn("flex items-end gap-2", message.sender === "user" ? "justify-end" : "justify-start")}>
                            {message.sender === 'bot' && <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-4 w-4"/></AvatarFallback></Avatar>}
                            <div className={cn("max-w-[75%] rounded-lg p-3 text-sm", message.sender === "user" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none")}>
                            {message.text}
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
