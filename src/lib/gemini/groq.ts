
import OpenAI from "openai";
import { Content, FunctionCall } from "@google/generative-ai";
import { mealPlanningTools } from '../functions/mealPlanningTools';
import { executeMealPlanningFunction } from '../functions/executeFunctions';
import { FunctionCallResult } from '../functions/types';
import { getSystemPrompt } from "../prompts/systemPrompt";
import { StreamHandlers } from "./api";

// Groq fallback function using OpenAI SDK
export async function callGroqWithStreaming(
  contents: Content[],
  handlers: StreamHandlers
) {
  try {
    console.log("Falling back to Groq with OpenAI SDK, model: deepseek-r1-distill-llama-70b");

    const groqApiKey =
      process.env.GROQ_API_KEY ||
      (typeof window !== "undefined" && localStorage.getItem("groq_api_key"));

    if (!groqApiKey) {
      throw new Error("Groq API key not found. Please set GROQ_API_KEY.");
    }

    const openai = new OpenAI({
      apiKey: groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
      dangerouslyAllowBrowser: true,
    });

    // Convert Gemini format to OpenAI format for Groq
    const messages = contents.map((content) => ({
      role: content.role === "model" ? ("assistant" as const) : (content.role as "user" | "system"),
      content: content.parts.map((part) => 'text' in part ? part.text : "").join(""),
    }));

    messages.unshift({
      role: "system" as const,
      content: getSystemPrompt(),
    });

    const chatCompletion = await openai.chat.completions.create({
      model: "deepseek-r1-distill-llama-70b",
      messages,
      temperature: 0.6,
      max_tokens: 4096,
      top_p: 0.95,
      stream: true,
      tools: mealPlanningTools,
    });

    let accumulatedText = "";
    let functionCalls: FunctionCallResult[] = [];

    for await (const chunk of chatCompletion) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      // Handle function calls
      if (choice.delta.tool_calls) {
        for (const toolCall of choice.delta.tool_calls) {
          if (toolCall.function) {
            const functionCall: FunctionCallResult = {
              type: "function_call",
              id: toolCall.id || `fc_${Date.now()}`,
              call_id: `call_${Date.now()}`,
              name: toolCall.function.name || "",
              arguments: toolCall.function.arguments || "{}",
            };
            
            functionCalls.push(functionCall);
            handlers.onFunctionCall(functionCall as any); // Cast to any to satisfy handler
            handlers.onThought(`🔨 Executing function: ${functionCall.name}`);
            
            // Execute the function
            try {
              const result = await executeMealPlanningFunction(functionCall);
              handlers.onThought(`✅ Function result: ${result}`);
            } catch (error) {
              handlers.onThought(`❌ Function error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
      }

      // Handle regular text content
      const content = choice.delta?.content || "";
      if (content) {
        accumulatedText += content;
        handlers.onText(content);
      }
    }

    await handlers.onComplete();
  } catch (error) {
    console.error("Groq API (OpenAI SDK) error:", error);
    handlers.onError(error instanceof Error ? error : new Error("Groq API error"));
  }
}
