
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { INVENTORY_CATEGORIES } from "@/hooks/useInventory";

const categoryDescriptions = Object.values(INVENTORY_CATEGORIES).join(', ');

export const updateInventoryTool: FunctionDeclaration = {
    name: "updateInventory",
    description: "Adds or updates one or more items in the user's home inventory/pantry. Use this when the user mentions buying groceries, using up ingredients, or listing items they have on hand.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        items: {
          type: SchemaType.ARRAY,
          description: "A list of items to add or update in the inventory.",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              item_name: { type: SchemaType.STRING, description: "The name of the item (e.g., 'Flour', 'Chicken Breast')." },
              quantity: { type: SchemaType.NUMBER, description: "The quantity of the item." },
              unit: { type: SchemaType.STRING, description: "The unit of measurement (e.g., 'kg', 'lbs', 'cups', 'piece')." },
              category: { 
                type: SchemaType.STRING, 
                description: `The category of the item. Must be one of: ${Object.keys(INVENTORY_CATEGORIES).join(', ')}. The labels are: ${categoryDescriptions}.`
              }
            },
            required: ["item_name", "quantity", "unit", "category"]
          }
        }
      },
      required: ["items"],
    },
};
