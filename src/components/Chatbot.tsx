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
        // Step 1: Analyze user input
        const step1Id = addThoughtStep(
          "🔍 Analyzing user input", 
          `User message: "${userInput}"\n\nI'm examining this message to understand what the user wants. Let me identify key elements:\n- Keywords related to meal planning\n- Any dietary preferences or restrictions mentioned\n- Whether they're asking for a new plan or shopping list\n- Context from our conversation history`
        );
        
        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 500));
        updateThoughtStep(step1Id, 'completed');

        // Step 2: Determine appropriate response strategy
        const step2Id = addThoughtStep(
          "🎯 Determining response strategy",
          `Based on the user's message, I need to decide:\n\n1. Should I generate a new meal plan?\n2. Should I show the shopping list?\n3. Should I provide general nutrition advice?\n4. Do I need to ask for clarification?\n\nAnalyzing available functions:\n- updateMealPlan: For creating new 7-day meal plans\n- showShoppingList: For displaying shopping lists\n\nConsidering user's current meal plan and conversation context...`
        );
        
        await new Promise(resolve => setTimeout(resolve, 700));
        updateThoughtStep(step2Id, 'completed');

        // Step 3: Prepare conversation history
        const step3Id = addThoughtStep(
          "📚 Preparing conversation context",
          `Converting our conversation history to the format needed for the AI:\n\n${newMessages.slice(-5).map(m => `${m.sender === 'user' ? 'User' : 'NutriMate'}: ${m.text.substring(0, 100)}${m.text.length > 100 ? '...' : ''}`).join('\n')}\n\nThis context helps me provide personalized and relevant responses.`
        );

        const history: Content[] = newMessages.map(msg => ({
            role: msg.sender === 'bot' ? 'model' : 'user',
            parts: [{ text: msg.text }],
        }));

        updateThoughtStep(step3Id, 'completed');

        // Step 4: Generate AI response
        const step4Id = addThoughtStep(
          "🤖 Generating AI response",
          `Calling Gemini AI model (gemini-2.5-flash-preview-05-20) with:\n- System instructions for NutriMate behavior\n- Available tools (updateMealPlan, showShoppingList)\n- Conversation history\n- User's current request\n\nWaiting for AI to process and determine the best response...`
        );

        const response = await callGemini(apiKey, history);
        updateThoughtStep(step4Id, 'completed');

        // Step 5: Process AI response
        const step5Id = addThoughtStep(
          "⚙️ Processing AI response",
          `AI response received! Now analyzing what the AI decided to do:\n\n- Checking for function calls (meal plan updates, shopping list requests)\n- Extracting the text response\n- Determining if any actions need to be taken\n\nResponse structure: ${JSON.stringify(response.candidates?.[0]?.content.parts.map(p => Object.keys(p)), null, 2)}`
        );

        const functionCalls = response.candidates?.[0]?.content.parts
            .map(p => p.functionCall)
            .filter((fc): fc is FunctionCall => !!fc);

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            updateThoughtStep(step5Id, 'completed');
            
            if (call.name === 'updateMealPlan') {
                const step6Id = addThoughtStep(
                  "🍽️ Updating meal plan",
                  `The AI decided to create a new meal plan! Here's what's happening:\n\n1. Extracting the new 7-day meal plan from the AI response\n2. Validating the plan structure (days, meals, ingredients, etc.)\n3. Updating the application state with the new plan\n4. This will refresh the meal plan display\n\nNew plan includes meals for: ${(call.args as MealPlan)?.days?.map(d => d.day).join(', ') || 'processing...'}`
                );
                const newPlan = call.args as MealPlan;
                setPlan(newPlan);
                updateThoughtStep(step6Id, 'completed');
            } else if (call.name === 'showShoppingList') {
                const step6Id = addThoughtStep(
                  "🛒 Showing shopping list",
                  `The AI determined the user wants to see their shopping list!\n\n1. Opening the shopping list dialog\n2. The shopping list is automatically generated from the current meal plan\n3. It consolidates all ingredients across all meals for the week\n4. Duplicate ingredients are combined with total quantities\n\nThis helps users know exactly what to buy for their meal plan.`
                );
                setIsShoppingListOpen(true);
                updateThoughtStep(step6Id, 'completed');
            }

            // Step 7: Generate final user message
            const step7Id = addThoughtStep(
              "💬 Generating final response",
              `Now I need to create a user-friendly message explaining what I've done:\n\n1. Sending function execution confirmation back to the AI\n2. Requesting a natural language response for the user\n3. This creates a conversational flow rather than just executing functions silently\n\nThe user will see both the action (updated plan/shopping list) and a friendly explanation.`
            );
            
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
            updateThoughtStep(step7Id, 'completed');
        } else {
            // Direct text response without function calls
            const responseText = response.candidates?.[0]?.content.parts.map(p => p.text).join('') ?? '';
            updateThoughtStep(step5Id, 'completed', `AI provided a direct text response without any function calls:\n\n"${responseText}"\n\nThis means the AI determined that no meal plan updates or shopping list requests were needed - just a conversational response.`);
            
            const botMessage: Message = { 
                id: Date.now() + 1, 
                text: responseText, 
                sender: "bot",
            };
            setMessages(prev => [...prev, botMessage]);
        }

        // Final completion step
        const finalStepId = addThoughtStep(
          "✅ Response complete",
          `Successfully processed the user's request!\n\nSummary of actions taken:\n- Analyzed user input\n- Determined appropriate response strategy\n- Generated AI response using Gemini model\n- ${functionCalls?.length ? `Executed ${functionCalls[0].name} function` : 'Provided conversational response'}\n- Updated the chat interface\n\nReady for the next user interaction!`
        );
        updateThoughtStep(finalStepId, 'completed');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast.error(errorMessage);
        setMessages(messages);
        
        const errorStepId = addThoughtStep(
          "❌ Error occurred", 
          `An error happened while processing your request:\n\nError: ${errorMessage}\n\nThis could be due to:\n- API key issues\n- Network connectivity problems\n- AI model availability\n- Invalid request format\n\nPlease check the error message and try again.`
        );
        updateThoughtStep(errorStepId, 'completed');
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
