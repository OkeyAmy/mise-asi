import { FunctionCall } from "@google/generative-ai";
import { FunctionHandlerArgs } from "./handlers/handlerUtils";
import { handleInventoryFunctions } from "./handlers/inventoryHandlers";
import { handleLeftoverFunctions } from "./handlers/leftoverHandlers";
import { handleMealFunctions } from "./handlers/mealHandlers";
import { handlePreferenceFunctions } from "./handlers/preferenceHandlers";
import { handleShoppingListFunctions } from "./handlers/shoppingListHandlers";
import { handleUtilityFunctions } from "./handlers/utilityHandlers";
import { handleNotesFunctions } from "./handlers/notesHandlers";

// Function handler mapping - each function is handled independently and can be called in parallel
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
  adjustLeftoverServings: handleLeftoverFunctions,
  removeLeftover: handleLeftoverFunctions,
  getUserPreferences: handlePreferenceFunctions,
  updateUserPreferences: handlePreferenceFunctions,
  updateUserNotes: handleNotesFunctions,
};

/**
 * Handles individual function calls. This function is designed to work with parallel execution.
 * Multiple functions can be called simultaneously via Promise.all() in useChat.ts
 * 
 * @param functionCall - The function call from Gemini
 * @param args - Arguments including data handlers and UI updaters
 * @returns Promise<string> - Result message that will be sent back to the LLM
 */
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
