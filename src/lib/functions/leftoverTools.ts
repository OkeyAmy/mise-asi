
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const getLeftoversTool: FunctionDeclaration = {
  name: "getLeftovers",
  description: "Retrieves a list of the user's current leftover meals from previous days.",
  parameters: { type: SchemaType.OBJECT, properties: {} },
};

export const addLeftoverTool: FunctionDeclaration = {
  name: "addLeftover",
  description: "Adds a new meal to the user's list of leftovers.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      meal_name: { type: SchemaType.STRING, description: "The name of the leftover meal (e.g., 'Spaghetti Bolognese')." },
      servings: { type: SchemaType.NUMBER, description: "The number of servings available." },
      notes: { type: SchemaType.STRING, description: "Any notes about the leftover meal." },
    },
    required: ["meal_name", "servings"],
  },
};

export const updateLeftoverTool: FunctionDeclaration = {
  name: "updateLeftover",
  description: "Updates an existing leftover item, for example, to change the number of servings.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      leftover_id: { type: SchemaType.STRING, description: "The ID of the leftover item to update." },
      servings: { type: SchemaType.NUMBER, description: "The new number of servings." },
      notes: { type: SchemaType.STRING, description: "Updated notes for the leftover." }
    },
    required: ["leftover_id"],
  },
};

export const removeLeftoverTool: FunctionDeclaration = {
  name: "removeLeftover",
  description: "Removes a meal from the user's leftovers list, e.g., after it has been eaten. You must provide EITHER the meal_name OR the leftover_id.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      leftover_id: { type: SchemaType.STRING, description: "The ID of the leftover item to remove. Use this if you know the exact ID." },
      meal_name: { type: SchemaType.STRING, description: "The name of the leftover meal to remove (e.g., 'Spaghetti Bolognese'). Use this for removal by name." },
    },
  },
};

export const showLeftoversTool: FunctionDeclaration = {
    name: "showLeftovers",
    description: "Shows the leftovers UI popup to the user.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
};
