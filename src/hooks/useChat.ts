
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Content, FunctionCall } from "@google/generative-ai";
import { ThoughtStep } from "@/data/schema";
import { callGemini, callGeminiWithStreaming } from "@/lib/gemini/api";
import { Message, UseChatProps, getInitialMessages, initialMessages } from "./chat/types";
import { handleFunctionCall } from "./chat/functionHandlers";

export const useChat = (props: UseChatProps) => {
  const {
    apiKey,
    setThoughtSteps,
    onApiKeyMissing,
    ...functionHandlerArgs
  } = props;
  const [messages, setMessages] = useState<Message[]>(getInitialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  const resetConversation = () => {
    setMessages(initialMessages);
    setInputValue("");
    setIsThinking(false);
    setThoughtSteps([]);
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
    let functionCall: FunctionCall | null = null;

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
        if (!functionCall) {
          functionCall = call;
          addThoughtStep(
            `🔨 Preparing to call function: ${call.name}`,
            JSON.stringify(call.args, null, 2),
            "active"
          );
        }
      },
      onComplete: async () => {
        setIsThinking(false);

        if (functionCall) {
          const funcResultMsg = await handleFunctionCall(functionCall, { ...functionHandlerArgs, addThoughtStep });

          const functionResponsePart = {
            functionResponse: {
              name: functionCall.name,
              response: { success: true, message: funcResultMsg },
            },
          };

          const historyWithFunctionCall: Content[] = [
            ...history,
            { role: "model", parts: [{ functionCall }] },
            { role: "user", parts: [functionResponsePart] },
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
            const botMessage: Message = {
              id: Date.now() + 1,
              text: finalText,
              sender: "bot",
            };
            setMessages((prev) => [...newMessages, botMessage]);
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
