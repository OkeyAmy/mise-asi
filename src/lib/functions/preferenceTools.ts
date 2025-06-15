
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const getUserPreferencesTool: FunctionDeclaration = {
  name: "getUserPreferences",
  description: "Retrieves the user's saved preferences, including dietary restrictions, allergies, health goals, and liked/disliked cuisines or ingredients.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
  },
};

export const updateUserPreferencesTool: FunctionDeclaration = {
  name: "updateUserPreferences",
  description: "Updates the user's preferences. Use this when the user specifies new allergies, goals, or other long-term preferences.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      restrictions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "List of dietary restrictions (e.g. 'vegetarian', 'gluten-free')." },
      goals: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "List of health or nutrition goals." },
      swap_preferences: {
        type: SchemaType.OBJECT,
        properties: {
          preferred_cuisines: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Cuisines the user prefers." },
          disliked_ingredients: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Ingredients the user wants to avoid." }
        }
      }
    },
  },
};
