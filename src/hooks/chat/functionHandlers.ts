
import { FunctionCall } from "@google/generative-ai";
import { FunctionHandlerArgs } from "./handlers/handlerUtils";
import { handleInventoryFunctions } from "./handlers/inventoryHandlers";
import { handleLeftoverFunctions } from "./handlers/leftoverHandlers";
import { handleMealFunctions } from "./handlers/mealHandlers";
import { handlePreferenceFunctions } from "./handlers/preferenceHandlers";
import { handleShoppingListFunctions } from "./handlers/shoppingListHandlers";
import { handleUtilityFunctions } from "./handlers/utilityHandlers";

const functionHandlers: { [key: string]: (functionCall: FunctionCall, args: FunctionHandlerArgs) => Promise<string> } = {
  suggestMeal: handleMealFunctions,
  updateMealPlan: handleMealFunctions,
  showShoppingList: handleShoppingListFunctions,
  getShoppingList: handleShoppingListFunctions,
  addToShoppingList: handleShoppingListFunctions,
  removeFromShoppingList: handleShoppingListFunctions,
  updateInventory: handleInventoryFunctions,
  getInventory: handleInventoryFunctions,
  getCurrentTime: handleUtilityFunctions,
  showLeftovers: handleLeftoverFunctions,
  getLeftovers: handleLeftoverFunctions,
  addLeftover: handleLeftoverFunctions,
  updateLeftover: handleLeftoverFunctions,
  removeLeftover: handleLeftoverFunctions,
  getUserPreferences: handlePreferenceFunctions,
  updateUserPreferences: handlePreferenceFunctions,
  updateUserNotes: handlePreferenceFunctions,
};

export const handleFunctionCall = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const handler = functionHandlers[functionCall.name];
  if (handler) {
    return handler(functionCall, args);
  }

  console.warn(`No handler found for function call: ${functionCall.name}`);
  return `Function call ${functionCall.name} is not handled by any known handler.`;
};
