import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Content, FunctionCall, Part } from "@google/generative-ai";
import { ThoughtStep } from "@/data/schema";
import { callGemini, callGeminiWithStreaming } from "@/lib/gemini/api";
import { Message, UseChatProps, initialMessages } from "./chat/types";
import { handleFunctionCall } from "./chat/functionHandlers";
import { useChatHistory } from "./useChatHistory";

export const useChat = (props: UseChatProps) => {
  const {
    apiKey,
    setThoughtSteps,
    onApiKeyMissing,
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

    if (!apiKey) {
      onApiKeyMissing();
      toast.error("Please set your Gemini API key first.");
      return;
    }

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

    const history: Content[] = newMessages.map((msg) => ({
      role: msg.sender === "bot" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

    let accumulatedText = "";
    const functionCalls: FunctionCall[] = [];

    await callGeminiWithStreaming(apiKey, history, {
      onThought: (thought: string) => {
        addThoughtStep(thought);
      },
      onText: (textChunk: string) => {
        accumulatedText += textChunk;
        setMessages((prev) => {
          const updatedMessages = [...prev];
          const lastMessage = updatedMessages[updatedMessages.length - 1];

          if (lastMessage && lastMessage.sender === "bot") {
            lastMessage.text = accumulatedText;
            return updatedMessages;
          } else {
            const newBotMessage: Message = {
              id: Date.now() + 5000,
              text: accumulatedText,
              sender: "bot",
            };
            return [...updatedMessages, newBotMessage];
          }
        });
      },
      onFunctionCall: (call: FunctionCall) => {
        functionCalls.push(call);
        addThoughtStep(
          `🔨 Preparing to call function: ${call.name}`,
          JSON.stringify(call.args, null, 2),
          "active"
        );
      },
      onComplete: async () => {
        setIsThinking(false);

        if (functionCalls.length > 0) {
          const functionExecutionPromises = functionCalls.map(call => 
            handleFunctionCall(call, { ...functionHandlerArgs, addThoughtStep })
          );

          const functionResults = await Promise.all(functionExecutionPromises);

          const modelTurnParts: Part[] = functionCalls.map(fc => ({ functionCall: fc }));
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
          try {
            const finalResultResponse = await callGemini(
              apiKey,
              historyWithFunctionCall
            );
            const finalText =
              finalResultResponse.candidates?.[0]?.content.parts
                .map((p) => p.text)
                .join("") ?? "";

            const messageText = finalText.trim();

            if (messageText) {
              const botMessage: Message = {
                id: Date.now() + 1,
                text: messageText,
                sender: "bot",
              };
              setMessages((prev) => [...prev, botMessage]);
            } else {
              console.warn("Model did not generate a final text response after function calls.");
              const botMessage: Message = {
                id: Date.now() + 1,
                text: "I've processed the information, but I'm not sure what to say next. Could you clarify your request?",
                sender: "bot",
              };
              setMessages((prev) => [...prev, botMessage]);
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "An unknown error occurred.";
            toast.error(errorMessage);
            addThoughtStep(`❌ Error in final response: ${errorMessage}`);
          }
        } else if (accumulatedText.trim() === "") {
          const fallbackMessage: Message = {
            id: Date.now() + 1,
            text: "I'm not sure how to respond to that. Can you try rephrasing?",
            sender: "bot",
          };
          setMessages((prev) => [...prev, fallbackMessage]);
        }

        addThoughtStep("✨ Done!");
      },
      onError: (error: Error) => {
        setIsThinking(false);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unknown error occurred.";
        toast.error(errorMessage);
        addThoughtStep(`❌ Error: ${errorMessage}`);
      },
    });
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
