import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Content, Part } from "@google/generative-ai";
import { ThoughtStep, Message } from "@/data/schema";
import { UseChatProps } from "./chat/types";
import { handleFunctionCall } from "./chat/functionHandlers";
import { useChatHistory } from "./useChatHistory";
import { callGeminiProxy } from "./chat/geminiProxy";

const initialMessages: Message[] = [
  {
    id: 1,
    text: "Welcome to Mise! To get started, tell me about your eating habits, any restrictions, and your nutrition goals. You can also tell me what ingredients you have in your pantry.",
    sender: "bot",
  },
];

export const useChat = (props: UseChatProps) => {
  const {
    setThoughtSteps,
    session,
    ...functionHandlerArgs
  } = props;
  
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { saveChatSession, loadChatSession, clearChatSession } = useChatHistory(session);

  // Load chat history when user session is available
  useEffect(() => {
    const loadHistory = async () => {
      if (session?.user && !isInitialized) {
        const savedSession = await loadChatSession();
        if (savedSession) {
          setMessages(savedSession.messages);
          setThoughtSteps(savedSession.thoughtSteps);
        } else {
          // If no saved session, try to load from localStorage as fallback
          try {
            const stored = localStorage.getItem("chat_history");
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setMessages(parsed);
              }
            }
          } catch (e) {
            console.error("Could not parse chat history from local storage", e);
          }
        }
        setIsInitialized(true);
      }
    };

    loadHistory();
  }, [session, loadChatSession, isInitialized, setThoughtSteps]);

  // Save to database whenever messages or thought steps change
  useEffect(() => {
    if (session?.user && isInitialized && messages.length > 0) {
      // Debounce the save operation
      const timeoutId = setTimeout(() => {
        const currentThoughtSteps = props.thoughtSteps || [];
        saveChatSession(messages, currentThoughtSteps);
        // Also save to localStorage as backup
        localStorage.setItem("chat_history", JSON.stringify(messages));
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [messages, session, isInitialized, saveChatSession, props.thoughtSteps]);

  const resetConversation = async () => {
    setMessages(initialMessages);
    setInputValue("");
    setIsThinking(false);
    setThoughtSteps([]);
    
    // Clear from database
    await clearChatSession();
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem("chat_history", JSON.stringify(initialMessages));
    }
  };

  const addThoughtStep = (
    step: string,
    details?: string,
    status: "pending" | "active" | "completed" = "completed"
  ) => {
    const newStep: ThoughtStep = {
      id: Date.now().toString() + Math.random(),
      step,
      status,
      details: details || step,
    };
    setThoughtSteps((prev) => [...prev, newStep]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;

    setThoughtSteps(prev => 
      prev.map(s => ({ ...s, status: s.status === 'active' ? 'completed' : s.status }))
    );

    const userInput = inputValue.trim();
    const userMessage: Message = {
      id: Date.now(),
      text: userInput,
      sender: "user",
    };

    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsThinking(true);
    addThoughtStep("🤔 Thinking...");

    // Build conversation history including ALL previous function calls and results
    const history: Content[] = [];
    
    for (const msg of newMessages) {
      if (msg.sender === "user") {
        history.push({
          role: "user",
          parts: [{ text: msg.text }],
        });
      } else {
        // Bot message
        const parts: Part[] = [];
        
        // Add the text response
        if (msg.text) {
          parts.push({ text: msg.text });
        }
        
        // Add any function calls that were made
        if (msg.functionCalls) {
          console.log(`📋 Adding previous function calls to AI memory:`, msg.functionCalls.map(fc => fc.name));
          for (const fc of msg.functionCalls) {
            parts.push({
              functionCall: {
                name: fc.name,
                args: fc.arguments,
              },
            });
          }
        }
        
        if (parts.length > 0) {
          history.push({
            role: "model",
            parts,
          });
        }
        
        // Add function results as user messages (this is how Gemini expects them)
        if (msg.functionResults) {
          console.log(`📊 Adding previous function results to AI memory:`, msg.functionResults.map(fr => `${fr.functionName}: ${JSON.stringify(fr.result).substring(0, 100)}...`));
          const functionResponseParts: Part[] = msg.functionResults.map(result => ({
            functionResponse: {
              name: result.functionName,
              response: { success: true, message: result.result },
            },
          }));
          
          history.push({
            role: "user",
            parts: functionResponseParts,
          });
        }
      }
    }

    try {
      const response = await callGeminiProxy(history);

      const functionCalls = response.candidates?.[0]?.content?.parts
        .filter((p: Part) => p.functionCall)
        .map((p: Part) => p.functionCall) || [];

      if (functionCalls.length > 0) {
        addThoughtStep(`🔨 Calling functions: ${functionCalls.map(c => c.name).join(', ')}`);
        
        // Store function calls with unique IDs
        const functionCallsWithIds = functionCalls.map((call: any) => ({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: call.name,
          arguments: call.args || {},
        }));
        
        // Execute all function calls in parallel for maximum efficiency
        const functionExecutionPromises = functionCallsWithIds.map((call) => 
          handleFunctionCall(
            { name: call.name, args: call.arguments }, 
            { ...functionHandlerArgs, addThoughtStep }
          )
        );

        // Wait for all functions to complete in parallel
        const functionResults = await Promise.all(functionExecutionPromises);

        // Store function results
        const functionResultsWithIds = functionCallsWithIds.map((call, i) => ({
          functionCallId: call.id,
          functionName: call.name,
          result: functionResults[i],
        }));

        // Prepare the conversation history with function calls and results for final response
        const modelTurnParts: Part[] = functionCalls.map((fc: any) => ({ functionCall: fc }));
        const userTurnParts: Part[] = functionCalls.map((fc, i) => ({
          functionResponse: {
            name: fc.name,
            response: { success: true, message: functionResults[i] },
          },
        }));

        const historyWithFunctionCall: Content[] = [
          ...history,
          { role: "model", parts: modelTurnParts },
          { role: "user", parts: userTurnParts },
        ];

        addThoughtStep("💬 Generating final response...");
        const finalResultResponse = await callGeminiProxy(historyWithFunctionCall);
        
        const finalText = finalResultResponse.candidates?.[0]?.content.parts
            .map((p: Part) => p.text)
            .join("") ?? "";
        
        // Create bot message with function calls and results stored for future reference
        const botMessage: Message = { 
          id: Date.now() + 1, 
          text: finalText || "I've processed that. What's next?", 
          sender: "bot",
          functionCalls: functionCallsWithIds,
          functionResults: functionResultsWithIds,
        };
        
        console.log(`💾 Storing function calls in message for future memory:`, functionCallsWithIds.map(fc => fc.name));
        console.log(`💾 Storing function results in message for future memory:`, functionResultsWithIds.map(fr => `${fr.functionName}: success`));
        
        setMessages(prev => [...prev, botMessage]);

      } else {
        const text = response.candidates?.[0]?.content?.parts[0]?.text ?? "Sorry, I'm not sure how to respond.";
        const botMessage: Message = { id: Date.now() + 1, text, sender: "bot" };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast.error(errorMessage);
        addThoughtStep(`❌ Error: ${errorMessage}`);
    } finally {
        setIsThinking(false);
        setThoughtSteps((prev) =>
          prev.map((s) => ({ ...s, status: s.status === "active" ? "completed" : s.status }))
        );
        addThoughtStep("✨ Done!");
    }
  };

  return {
    messages,
    inputValue,
    setInputValue,
    isThinking,
    handleSendMessage,
    resetConversation,
  };
};
