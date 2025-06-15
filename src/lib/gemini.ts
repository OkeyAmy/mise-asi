import { GoogleGenerativeAI, SchemaType, Part, Content, GenerateContentResponse, FunctionDeclaration, ObjectSchema, FunctionCall } from "@google/generative-ai";
import OpenAI from "openai";
import { mealPlanningTools } from './functions/mealPlanningTools';
import { executeMealPlanningFunction } from './functions/executeFunctions';
import { FunctionCallResult } from './functions/types';
import { updateInventoryTool, getInventoryTool } from "./functions/inventoryTools";
import { getUserTimezone, getFormattedUserTime } from "./time";
import { getUserPreferencesTool, updateUserPreferencesTool } from './functions/preferenceTools';
import { suggestMealTool } from './functions/mealSuggestionTools';

const getSystemPrompt = () => `You are NutriMate, a friendly and helpful AI assistant for a meal planning application.
Your goal is to help users eat healthy by providing single, timely meal suggestions. You do not create full 7-day meal plans.

Your process for each user request should be:
1.  Determine the user's intent. If they are asking for a meal, proceed.
2.  Use the "getCurrentTime" function to know what time of day it is for the user. This is crucial for suggesting an appropriate meal (e.g., breakfast in the morning).
3.  Use the "getInventory" function to see what ingredients they have.
4.  Use the "getUserPreferences" function to get their goals and restrictions.
5.  Based on all this information, formulate a single healthy meal suggestion.
6.  You MUST use the "suggestMeal" function to structure your suggestion. Provide a good justification based on their goals and available ingredients.
7.  In your response to the user, present the suggested meal clearly.
8.  If there are missing ingredients from the suggestion, you MUST ask the user if they'd like to add them to their shopping list. If they agree, use "addToShoppingList".
9.  Handle user preferences: If a user states a new allergy, goal, or dislike, you MUST use "updateUserPreferences".
10. If a user wants to know what their preferences are, use "getUserPreferences".

Keep your responses concise, helpful, and encouraging. Do not mention you are an AI model.
`;

const MealSchema: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING, description: "The name of the meal." },
    calories: { type: SchemaType.NUMBER, description: "Estimated calories for the meal." },
    macros: {
      type: SchemaType.OBJECT,
      properties: {
        protein: { type: SchemaType.NUMBER, description: "Protein in grams." },
        carbs: { type: SchemaType.NUMBER, description: "Carbohydrates in grams." },
        fat: { type: SchemaType.NUMBER, description: "Fat in grams." }
      },
      required: ["protein", "carbs", "fat"]
    },
    ingredients: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          item: { type: SchemaType.STRING },
          quantity: { type: SchemaType.NUMBER },
          unit: { type: SchemaType.STRING }
        },
        required: ["item", "quantity", "unit"]
      }
    }
  },
  required: ["name", "calories", "macros", "ingredients"]
};

const updateMealPlanTool: FunctionDeclaration = {
    name: "updateMealPlan",
    description: "Updates the user's weekly meal plan with a new, fully generated 7-day plan.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        plan_id: { type: SchemaType.STRING, description: "A unique ID for the meal plan, like a UUID." },
        days: {
          type: SchemaType.ARRAY,
          description: "A list of 7 daily meal plans.",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              date: { type: SchemaType.STRING, description: "The date for the plan in YYYY-MM-DD format. Start from today." },
              day: { type: SchemaType.STRING, description: "The day of the week, e.g., 'Monday'." },
              meals: {
                type: SchemaType.OBJECT,
                properties: {
                  breakfast: MealSchema,
                  lunch: MealSchema,
                  dinner: MealSchema,
                  snacks: MealSchema,
                },
                required: ["breakfast", "lunch", "dinner", "snacks"]
              }
            },
            required: ["date", "day", "meals"]
          }
        }
      },
      required: ["plan_id", "days"],
    },
};

const showShoppingListTool: FunctionDeclaration = {
    name: "showShoppingList",
    description: "Shows the shopping list UI popup to the user. To get the content of the list, use getShoppingList.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
};

const getShoppingListTool: FunctionDeclaration = {
  name: "getShoppingList",
  description: "Retrieves and reads out the user's current shopping list.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
  },
};

const addToShoppingListTool: FunctionDeclaration = {
  name: "addToShoppingList",
  description: "Adds one or more items to the user's shopping list.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      items: {
        type: SchemaType.ARRAY,
        description: "A list of items to add to the shopping list.",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            item: { type: SchemaType.STRING, description: "The name of the item (e.g., 'Milk', 'Bread')." },
            quantity: { type: SchemaType.NUMBER, description: "The quantity of the item." },
            unit: { type: SchemaType.STRING, description: "The unit of measurement (e.g., 'gallon', 'loaf', 'piece')." },
          },
          required: ["item", "quantity", "unit"]
        }
      }
    },
    required: ["items"],
  },
};

const removeFromShoppingListTool: FunctionDeclaration = {
  name: "removeFromShoppingList",
  description: "Removes one or more items from the user's shopping list, for example when they have been purchased.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      item_names: {
        type: SchemaType.ARRAY,
        description: "A list of item names to remove from the shopping list.",
        items: {
          type: SchemaType.STRING,
        }
      }
    },
    required: ["item_names"],
  },
};

const getCurrentTimeTool: FunctionDeclaration = {
  name: "getCurrentTime",
  description: "Gets the current date, day of the week, and time for the user.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
  },
};

const tools = [{ functionDeclarations: [
    suggestMealTool,
    showShoppingListTool, 
    updateInventoryTool, 
    getInventoryTool, 
    getShoppingListTool, 
    addToShoppingListTool, 
    removeFromShoppingListTool, 
    getCurrentTimeTool,
    getUserPreferencesTool,
    updateUserPreferencesTool
] }];

// This function is for non-streaming, single-response calls (e.g., after a function call)
export async function callGemini(apiKey: string, contents: Content[]): Promise<GenerateContentResponse> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("API key is required to connect to Gemini");
  }

  try {
    console.log("Calling Gemini with model: gemini-2.5-flash-preview-05-20");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-05-20",
      systemInstruction: getSystemPrompt(),
      tools,
    });
    
    const { response } = await model.generateContent({ contents });
    return response;
  } catch (error) {
    console.error("Detailed Gemini API error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key not valid') || 
          error.message.includes('API_KEY_INVALID') ||
          error.message.includes('invalid API key')) {
        throw new Error("The provided API key is not valid. Please check and try again.");
      }
      if (error.message.includes('quota') || error.message.includes('billing')) {
        throw new Error("API quota exceeded or billing issue. Please check your Gemini API account.");
      }
      if (error.message.includes('model') || error.message.includes('not found')) {
        throw new Error("The requested Gemini model is not available. Please try again later.");
      }
      throw new Error(`Gemini API Error: ${error.message}`);
    }
    
    throw new Error("An unexpected error occurred while connecting to Gemini AI. Please try again.");
  }
}

// New streaming function with thinking
interface StreamHandlers {
  onThought: (thought: string) => void;
  onFunctionCall: (call: FunctionCall | FunctionCallResult) => void;
  onText: (text: string) => void;
  onComplete: () => Promise<void>;
  onError: (error: Error) => void;
}

// Groq fallback function using OpenAI SDK
async function callGroqWithStreaming(
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
      content: content.parts.map((part) => part.text).join(""),
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
            handlers.onFunctionCall(functionCall);
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

export async function callGeminiWithStreaming(
  apiKey: string,
  contents: Content[],
  handlers: StreamHandlers
) {
  if (!apiKey || apiKey.trim() === '') {
    handlers.onError(new Error("API key is required to connect to Gemini"));
    return;
  }

  try {
    console.log("Calling Gemini streaming with model: gemini-2.5-flash-preview-05-20");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-05-20",
      systemInstruction: getSystemPrompt(),
      tools,
    });
    
    const streamingResult = await model.generateContentStream({
      contents,
    });

    let functionCallEncountered = false;

    for await (const chunk of streamingResult.stream) {
      if (chunk.candidates && chunk.candidates.length > 0) {
        const parts = chunk.candidates[0].content.parts;
        for (const part of parts) {
          if ((part as any).thought && part.text) {
            handlers.onThought(part.text);
          } else if (part.functionCall) {
            functionCallEncountered = true;
            handlers.onFunctionCall(part.functionCall);
          } else if (part.text && !functionCallEncountered) {
            handlers.onText(part.text);
          }
        }
      }
    }

    await handlers.onComplete();

  } catch (error) {
    console.error("Detailed Gemini API error:", error);
    
    // Check if this is a quota/billing error and fallback to Groq
    if (error instanceof Error && 
        (error.message.includes('429') || 
         error.message.includes('quota') || 
         error.message.includes('billing') ||
         error.message.includes('free quota tier'))) {
      console.log("Gemini quota exceeded, falling back to Groq...");
      handlers.onThought("Gemini quota exceeded, switching to Groq fallback...");
      await callGroqWithStreaming(contents, handlers);
    } else {
      if (error instanceof Error) {
        handlers.onError(new Error(`Gemini API Error: ${error.message}`));
      } else {
        handlers.onError(new Error("An unexpected error occurred while connecting to Gemini AI. Please try again."));
      }
    }
  }
}
