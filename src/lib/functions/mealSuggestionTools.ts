
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

const MealSchema: FunctionDeclaration['parameters'] = {
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

export const suggestMealTool: FunctionDeclaration = {
  name: "suggestMeal",
  description: "Suggests a single, healthy meal to the user based on the time of day, their inventory, and preferences. This function formats the suggestion; it does not update any plans.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      meal_type: { type: SchemaType.STRING, description: "The type of meal, e.g., 'Breakfast', 'Lunch', 'Dinner', 'Snack'." },
      meal: MealSchema,
      justification: { type: SchemaType.STRING, description: "A short explanation of why this meal was chosen for the user." },
      missing_items: {
        type: SchemaType.ARRAY,
        description: "A list of ingredients required for the meal that are not in the user's inventory.",
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
    required: ["meal_type", "meal", "justification"]
  },
};
