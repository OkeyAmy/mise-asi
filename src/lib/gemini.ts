
import { GoogleGenerativeAI, FunctionDeclarationSchemaType, Part, Content, GenerateContentResponse, FunctionDeclaration } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are NutriMate, a friendly and helpful AI assistant for a meal planning application.
Your goal is to help users with their meal plans, nutrition goals, and pantry management.
Keep your responses concise, helpful, and encouraging.

When a user asks for a new meal plan, or to modify the existing one based on new preferences, goals, or pantry items, you MUST use the "updateMealPlan" function to generate and apply a completely new 7-day meal plan. You should infer the user's preferences from the conversation. After calling the function, confirm to the user that the plan has been updated.

If the user asks for their shopping list, tell them you're opening it for them.
If the user talks about their goals, confirm that their goals have been noted and that the meal plan will be updated (use the function!).
If the user talks about their pantry, acknowledge the new ingredients and consider them for the next meal plan generation.
For any other topic, provide a helpful response or admit if you can't help with a specific request.
Do not mention you are an AI model.
`;


const MealSchema = {
  type: FunctionDeclarationSchemaType.OBJECT,
  properties: {
    name: { type: FunctionDeclarationSchemaType.STRING, description: "The name of the meal." },
    calories: { type: FunctionDeclarationSchemaType.NUMBER, description: "Estimated calories for the meal." },
    macros: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        protein: { type: FunctionDeclarationSchemaType.NUMBER, description: "Protein in grams." },
        carbs: { type: FunctionDeclarationSchemaType.NUMBER, description: "Carbohydrates in grams." },
        fat: { type: FunctionDeclarationSchemaType.NUMBER, description: "Fat in grams." }
      },
      required: ["protein", "carbs", "fat"]
    },
    ingredients: {
      type: FunctionDeclarationSchemaType.ARRAY,
      items: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
          item: { type: FunctionDeclarationSchemaType.STRING },
          quantity: { type: FunctionDeclarationSchemaType.NUMBER },
          unit: { type: FunctionDeclarationSchemaType.STRING }
        },
        required: ["item", "quantity", "unit"]
      }
    }
  },
  required: ["name", "calories", "macros", "ingredients"]
};

const MealPlanSchema = {
    type: FunctionDeclarationSchemaType.OBJECT,
    properties: {
      plan_id: { type: FunctionDeclarationSchemaType.STRING, description: "A unique ID for the meal plan, like a UUID." },
      days: {
        type: FunctionDeclarationSchemaType.ARRAY,
        description: "A list of 7 daily meal plans.",
        items: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            date: { type: FunctionDeclarationSchemaType.STRING, description: "The date for the plan in YYYY-MM-DD format. Start from today." },
            day: { type: FunctionDeclarationSchemaType.STRING, description: "The day of the week, e.g., 'Monday'." },
            meals: {
              type: FunctionDeclarationSchemaType.OBJECT,
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
  };

const updateMealPlanTool: FunctionDeclaration = {
    name: "updateMealPlan",
    description: "Updates the user's weekly meal plan with a new, fully generated 7-day plan.",
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        newPlan: MealPlanSchema,
      },
      required: ["newPlan"],
    },
};

const tools = [{ functionDeclarations: [updateMealPlanTool] }];

export async function callGemini(apiKey: string, contents: Content[]): Promise<GenerateContentResponse> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      systemInstruction: SYSTEM_PROMPT,
      tools,
    });
    const result = await model.generateContent({ contents });
    return result;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID'))) {
        throw new Error("The provided API key is not valid. Please check and try again.");
    }
    throw new Error("Sorry, I encountered an error trying to connect to the AI. Please check the console for details.");
  }
}
