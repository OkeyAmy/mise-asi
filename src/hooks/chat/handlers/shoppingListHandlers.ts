
import { FunctionCall } from "@google/generative-ai";
import { MealPlan, ShoppingListItem } from "@/data/schema";
import { FunctionHandlerArgs } from "./handlerUtils";

export const handleShoppingListFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const {
    addThoughtStep,
    setIsShoppingListOpen,
    onUpdateShoppingList,
    shoppingListItems,
    onAddItemsToShoppingList,
    onRemoveItemsFromShoppingList,
  } = args;
  let funcResultMsg = "";

  if (functionCall.name === "showShoppingList") {
    try {
      const plan = functionCall.args as MealPlan;
      let allIngredients: ShoppingListItem[] = [];
      if (plan?.days) {
        const allIng = new Map<string, ShoppingListItem>();
        plan.days.forEach((day) => {
          Object.values(day.meals).forEach((meal) => {
            meal.ingredients.forEach((ing) => {
              if (allIng.has(ing.item)) {
                const existing = allIng.get(ing.item)!;
                existing.quantity += ing.quantity;
              } else {
                allIng.set(ing.item, { ...ing });
              }
            });
          });
        });
        allIngredients = Array.from(allIng.values());
      }
      if(onUpdateShoppingList) {
        onUpdateShoppingList(allIngredients);
      }
      funcResultMsg = "Shopping list updated and shown!";
    } catch {
      funcResultMsg = "Couldn't extract shopping list from plan.";
    }
    setIsShoppingListOpen(true);
    addThoughtStep("✅ Executed: showShoppingList");
  } else if (functionCall.name === "getShoppingList") {
    if (shoppingListItems && shoppingListItems.length > 0) {
      funcResultMsg = "Here is your current shopping list:\n" + shoppingListItems.map(item => `- ${item.quantity} ${item.unit} of ${item.item}`).join('\n');
    } else {
      funcResultMsg = "Your shopping list is currently empty.";
    }
    setIsShoppingListOpen(true);
    addThoughtStep("✅ Executed: getShoppingList");
  } else if (functionCall.name === "addToShoppingList") {
    try {
      const { items } = functionCall.args as { items: ShoppingListItem[] };
      if (onAddItemsToShoppingList) {
        await onAddItemsToShoppingList(items);
        funcResultMsg = "I've added the items to your shopping list.";
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
        funcResultMsg = "I've removed the items from your shopping list.";
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
