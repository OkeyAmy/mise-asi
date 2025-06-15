
import { FunctionCall } from "@google/generative-ai";
import { ShoppingListItem } from "@/data/schema";
import { FunctionHandlerArgs } from "./handlerUtils";

export const handleShoppingListFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep, setIsShoppingListOpen, shoppingListItems, onAddItemsToShoppingList, onRemoveItemsFromShoppingList } = args;
  let funcResultMsg = "";

  if (functionCall.name === "showShoppingList") {
    setIsShoppingListOpen(true);
    funcResultMsg = "I've opened your shopping list for you.";
    addThoughtStep("✅ Executed: showShoppingList");
  } else if (functionCall.name === "getShoppingList") {
    if (shoppingListItems && shoppingListItems.length > 0) {
      const itemsList = shoppingListItems.map(item => `- ${item.quantity} ${item.unit} of ${item.item}`).join('\n');
      funcResultMsg = `Here is your current shopping list:\n${itemsList}`;
    } else {
      funcResultMsg = "Your shopping list is currently empty.";
    }
    addThoughtStep("✅ Executed: getShoppingList");
  } else if (functionCall.name === "addToShoppingList") {
    try {
      const { items } = functionCall.args as { items: ShoppingListItem[] };
      if (onAddItemsToShoppingList) {
        await onAddItemsToShoppingList(items);
        const itemNames = items.map(item => item.item).join(', ');
        funcResultMsg = `I've added ${itemNames} to your shopping list.`;
      } else {
        funcResultMsg = "Shopping list function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble adding items to your shopping list.";
    }
    addThoughtStep("✅ Executed: addToShoppingList");
  } else if (functionCall.name === "removeFromShoppingList") {
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
    addThoughtStep("✅ Executed: removeFromShoppingList");
  }

  return funcResultMsg;
};
