
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const updateInventoryTool: FunctionDeclaration = {
  name: "updateInventory",
  description: "Add or update items in the user's home inventory/pantry. Use this when the user mentions they have certain ingredients or items at home.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      items: {
        type: SchemaType.ARRAY,
        description: "List of inventory items to add or update",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            item_name: { type: SchemaType.STRING, description: "Name of the item" },
            category: { 
              type: SchemaType.STRING, 
              description: "Category of the item",
              enum: ["proteins", "vegetables", "fruits", "grains", "dairy", "spices", "pantry_staples", "beverages", "frozen", "canned", "other"]
            },
            quantity: { type: SchemaType.NUMBER, description: "Quantity of the item" },
            unit: { type: SchemaType.STRING, description: "Unit of measurement (e.g., cups, lbs, pieces)" },
            location: { type: SchemaType.STRING, description: "Where the item is stored (e.g., pantry, fridge, freezer)" },
            notes: { type: SchemaType.STRING, description: "Additional notes about the item" }
          },
          required: ["item_name", "category", "quantity", "unit"]
        }
      }
    },
    required: ["items"]
  }
};
