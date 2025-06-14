import { GoogleGenerativeAI, SchemaType, Part, Content, GenerateContentResponse, FunctionDeclaration, ObjectSchema, FunctionCall } from "@google/generative-ai";

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
    description: "Displays the shopping list to the user based on the current meal plan.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
};

const tools = [{ functionDeclarations: [updateMealPlanTool, showShoppingListTool] }];

// This function is for non-streaming, single-response calls (e.g., after a function call)
export async function callGemini(apiKey: string, contents: Content[]): Promise<GenerateContentResponse> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("API key is required to connect to Gemini");
  }

  try {
    console.log("Calling Gemini with model: gemini-pro");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      systemInstruction: SYSTEM_PROMPT,
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
  onFunctionCall: (call: FunctionCall) => void;
  onText: (text: string) => void;
  onComplete: () => Promise<void>;
  onError: (error: Error) => void;
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
    console.log("Calling Gemini with streaming enabled");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      systemInstruction: SYSTEM_PROMPT,
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
          if (part.functionCall) {
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
    if (error instanceof Error) {
        handlers.onError(new Error(`Gemini API Error: ${error.message}`));
    } else {
        handlers.onError(new Error("An unexpected error occurred while connecting to Gemini AI. Please try again."));
    }
  }
}
