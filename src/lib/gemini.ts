
import OpenAI from "openai";
import { mealPlanningTools } from './functions/mealPlanningTools';

const SYSTEM_PROMPT = `You are NutriMate, a friendly and helpful AI assistant for a meal planning application.
Your goal is to help users with their meal plans, nutrition goals, and pantry management.
Keep your responses concise, helpful, and encouraging.

When a user asks for a new meal plan, or to modify the existing one based on new preferences, goals, or pantry items, you MUST use the "updateMealPlan" function to generate and apply a completely new 7-day meal plan. You should infer the user's preferences from the conversation. After calling the function, confirm to the user that the plan has been updated.

If the user asks for their shopping list, you MUST use the "showShoppingList" function. After calling the function, confirm to the user that you're showing it.
If the user talks about their goals, confirm that their goals have been noted and that the meal plan will be updated (use the function!).
If the user talks about their pantry, acknowledge the new ingredients and consider them for the next meal plan generation.
For any other topic, provide a helpful response or admit if you can't help with a specific request.
Do not mention you are an AI model.
`;

// This function is for non-streaming, single-response calls (e.g., after a function call)
export async function callGemini(apiKey: string, messages: OpenAI.Chat.ChatCompletionMessageParam[]): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("API key is required to connect to Gemini");
  }

  try {
    console.log("Calling Gemini with OpenAI SDK, model: gemini-2.5-flash-preview-05-20");
    const openai = new OpenAI({
      apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      dangerouslyAllowBrowser: true,
    });
    
    const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
        model: "gemini-2.5-flash-preview-05-20",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        tools: mealPlanningTools,
    };
    (params as any).reasoning_effort = "low";

    const response = await openai.chat.completions.create(params);

    return response;

  } catch (error) {
    console.error("Detailed Gemini API (via OpenAI SDK) error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key not valid') || 
          error.message.includes('API_KEY_INVALID') ||
          error.message.includes('invalid API key')) {
        throw new Error("The provided API key is not valid. Please check and try again.");
      }
      throw new Error(`Gemini API Error: ${error.message}`);
    }
    
    throw new Error("An unexpected error occurred while connecting to Gemini AI. Please try again.");
  }
}

// New streaming function with thinking
interface StreamHandlers {
  onFunctionCall: (toolCall: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall) => void;
  onText: (text: string) => void;
  onComplete: () => Promise<void>;
  onError: (error: Error) => void;
}

export async function callGeminiWithStreaming(
  apiKey: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  handlers: StreamHandlers
) {
  if (!apiKey || apiKey.trim() === '') {
    handlers.onError(new Error("API key is required to connect to Gemini"));
    return;
  }

  try {
    console.log("Calling Gemini streaming with OpenAI SDK, model: gemini-2.5-flash-preview-05-20");
    const openai = new OpenAI({
      apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      dangerouslyAllowBrowser: true,
    });

    const params: OpenAI.Chat.ChatCompletionCreateParamsStreaming = {
      model: "gemini-2.5-flash-preview-05-20",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      tools: mealPlanningTools,
      stream: true,
    };
    (params as any).reasoning_effort = "low";
    
    const stream = await openai.chat.completions.create(params);

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      const { delta } = choice;

      if (delta.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          if (toolCall.function) {
            handlers.onFunctionCall(toolCall);
          }
        }
      }

      const content = delta.content || "";
      if (content) {
        handlers.onText(content);
      }
    }

    await handlers.onComplete();

  } catch (error) {
    console.error("Detailed Gemini API (via OpenAI SDK) error:", error);
    if (error instanceof Error) {
        handlers.onError(new Error(`Gemini API Error: ${error.message}`));
    } else {
        handlers.onError(new Error("An unexpected error occurred while connecting to Gemini AI. Please try again."));
    }
  }
}
