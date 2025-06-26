
import OpenAI from "openai";
import { Content, FunctionCall } from "@google/generative-ai";
import { tools } from './tools';
import { getSystemPrompt } from "../prompts/systemPrompt";
import { StreamHandlers } from "./api";

// Groq fallback function using OpenAI SDK to work exactly like Gemini
export async function callGroqWithStreaming(
  contents: Content[],
  handlers: StreamHandlers
) {
  try {
    console.log("Falling back to Groq with OpenAI SDK, model: deepseek-r1-distill-llama-70b");

    // Note: In browser context, we'll get the API key from the edge function
    // This function will primarily be called from edge functions where Deno.env is available
    let groqApiKey: string | undefined;
    
    // Check if we're in a Deno environment (edge function)
    if (typeof window === 'undefined' && typeof globalThis.Deno !== 'undefined') {
      groqApiKey = globalThis.Dene?.env?.get("GROQ_API_KEY");
    }

    if (!groqApiKey) {
      throw new Error("Groq API key not found. Please set GROQ_API_KEY in Supabase secrets.");
    }

    const openai = new OpenAI({
      apiKey: groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
      dangerouslyAllowBrowser: true,
    });

    // Convert Gemini format to OpenAI format for Groq
    const messages = contents.map((content) => {
      if (content.role === "model") {
        return {
          role: "assistant" as const,
          content: content.parts.map((part) => 'text' in part ? part.text : "").join(""),
        };
      } else {
        return {
          role: content.role as "user" | "system",
          content: content.parts.map((part) => 'text' in part ? part.text : "").join(""),
        };
      }
    });

    // Add system message at the beginning
    messages.unshift({
      role: "system" as const,
      content: getSystemPrompt(),
    });

    // Convert Gemini tools to OpenAI format with proper typing
    const openAITools = tools[0].functionDeclarations.map(func => ({
      type: "function" as const,
      function: {
        name: func.name,
        description: func.description,
        parameters: func.parameters as Record<string, any>,
      }
    }));

    const chatCompletion = await openai.chat.completions.create({
      model: "deepseek-r1-distill-llama-70b",
      messages,
      temperature: 0.6,
      max_tokens: 4096,
      top_p: 0.95,
      stream: true,
      tools: openAITools,
    });

    let functionCalls: any[] = [];

    for await (const chunk of chatCompletion) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      // Handle function calls - convert back to Gemini format
      if (choice.delta.tool_calls) {
        for (const toolCall of choice.delta.tool_calls) {
          if (toolCall.function) {
            const functionCall: FunctionCall = {
              name: toolCall.function.name || "",
              args: JSON.parse(toolCall.function.arguments || "{}"),
            };
            
            functionCalls.push(functionCall);
            handlers.onFunctionCall(functionCall);
            handlers.onThought(`🔨 Executing function: ${functionCall.name}`);
          }
        }
      }

      // Handle regular text content
      const content = choice.delta?.content || "";
      if (content) {
        handlers.onText(content);
      }
    }

    await handlers.onComplete();
  } catch (error) {
    console.error("Groq API (OpenAI SDK) error:", error);
    handlers.onError(error instanceof Error ? error : new Error("Groq API error"));
  }
}

// Non-streaming Groq function for single responses (like after function calls)
export async function callGroq(contents: Content[]): Promise<any> {
  try {
    console.log("Calling Groq non-streaming fallback");

    // Note: In browser context, we'll get the API key from the edge function
    let groqApiKey: string | undefined;
    
    // Check if we're in a Deno environment (edge function)
    if (typeof window === 'undefined' && typeof globalThis.Deno !== 'undefined') {
      groqApiKey = globalThis.Deno?.env?.get("GROQ_API_KEY");
    }

    if (!groqApiKey) {
      throw new Error("Groq API key not found. Please set GROQ_API_KEY in Supabase secrets.");
    }

    const openai = new OpenAI({
      apiKey: groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
      dangerouslyAllowBrowser: true,
    });

    // Convert Gemini format to OpenAI format
    const messages = contents.map((content) => {
      if (content.role === "model") {
        return {
          role: "assistant" as const,
          content: content.parts.map((part) => 'text' in part ? part.text : "").join(""),
        };
      } else {
        return {
          role: content.role as "user" | "system",
          content: content.parts.map((part) => 'text' in part ? part.text : "").join(""),
        };
      }
    });

    messages.unshift({
      role: "system" as const,
      content: getSystemPrompt(),
    });

    // Convert tools to OpenAI format with proper typing
    const openAITools = tools[0].functionDeclarations.map(func => ({
      type: "function" as const,
      function: {
        name: func.name,
        description: func.description,
        parameters: func.parameters as Record<string, any>,
      }
    }));

    const response = await openai.chat.completions.create({
      model: "deepseek-r1-distill-llama-70b",
      messages,
      temperature: 0.6,
      max_tokens: 4096,
      top_p: 0.95,
      tools: openAITools,
    });

    // Convert response back to Gemini format
    const choice = response.choices[0];
    const parts = [];

    if (choice.message.content) {
      parts.push({ text: choice.message.content });
    }

    if (choice.message.tool_calls) {
      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.function) {
          parts.push({
            functionCall: {
              name: toolCall.function.name,
              args: JSON.parse(toolCall.function.arguments || "{}"),
            }
          });
        }
      }
    }

    return {
      candidates: [{
        content: { parts }
      }]
    };

  } catch (error) {
    console.error("Groq non-streaming API error:", error);
    throw error;
  }
}
