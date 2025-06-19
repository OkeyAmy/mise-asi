
import { FunctionCall } from "@google/generative-ai";
import { ShoppingListItem } from "@/data/schema";
import { FunctionHandlerArgs } from "./handlerUtils";

export const handleShoppingListCrudFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep, shoppingListItems, onAddItemsToShoppingList, onRemoveItemsFromShoppingList, onUpdateShoppingList } = args;
  let funcResultMsg = "";

  // GET - Retrieve shopping list items
  if (functionCall.name === "getShoppingListItems") {
    addThoughtStep("✅ Retrieved shopping list items");
    
    if (shoppingListItems && shoppingListItems.length > 0) {
      let shoppingListDetails = "Current shopping list items:\n\n";
      shoppingListItems.forEach((item, index) => {
        shoppingListDetails += `- Item ${index + 1}:\n`;
        shoppingListDetails += `  Name: ${item.item}\n`;
        shoppingListDetails += `  Quantity: ${item.quantity} ${item.unit}\n\n`;
      });
      funcResultMsg = shoppingListDetails;
    } else {
      funcResultMsg = "The shopping list is currently empty.";
    }
  }

  // POST - Create new shopping list items
  else if (functionCall.name === "createShoppingListItems") {
    try {
      const { items } = functionCall.args as { items: ShoppingListItem[] };
      if (onAddItemsToShoppingList) {
        await onAddItemsToShoppingList(items);
        const itemNames = items.map(item => item.item).join(', ');
        funcResultMsg = `I've added ${items.length} new item(s) to your shopping list: ${itemNames}.`;
      } else {
        funcResultMsg = "Shopping list function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble adding items to your shopping list.";
    }
    addThoughtStep("✅ Created shopping list items");
  }

  // PUT - Replace entire shopping list
  else if (functionCall.name === "replaceShoppingList") {
    try {
      const { items } = functionCall.args as { items: ShoppingListItem[] };
      if (onUpdateShoppingList) {
        await onUpdateShoppingList(items);
        funcResultMsg = `I've replaced your entire shopping list with ${items.length} new item(s).`;
      } else {
        funcResultMsg = "Shopping list function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble replacing your shopping list.";
    }
    addThoughtStep("✅ Replaced shopping list");
  }

  // PATCH - Update specific shopping list item quantities
  else if (functionCall.name === "updateShoppingListItem") {
    try {
      const { item_name, quantity, unit } = functionCall.args as { item_name: string; quantity?: number; unit?: string };
      
      if (shoppingListItems && onUpdateShoppingList) {
        const updatedItems = shoppingListItems.map(item => {
          if (item.item.toLowerCase() === item_name.toLowerCase()) {
            return {
              ...item,
              quantity: quantity !== undefined ? quantity : item.quantity,
              unit: unit !== undefined ? unit : item.unit
            };
          }
          return item;
        });
        
        await onUpdateShoppingList(updatedItems);
        funcResultMsg = `I've updated ${item_name} in your shopping list.`;
      } else {
        funcResultMsg = "Shopping list function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble updating the shopping list item.";
    }
    addThoughtStep("✅ Updated shopping list item");
  }

  // DELETE - Remove shopping list items
  else if (functionCall.name === "deleteShoppingListItems") {
    try {
      const { item_names } = functionCall.args as { item_names: string[] };
      if (onRemoveItemsFromShoppingList) {
        await onRemoveItemsFromShoppingList(item_names);
        funcResultMsg = `I've removed ${item_names.join(', ')} from your shopping list.`;
      } else {
        funcResultMsg = "Shopping list function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble removing items from your shopping list.";
    }
    addThoughtStep("✅ Deleted shopping list items");
  }

  return funcResultMsg;
};
