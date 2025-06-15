
import { suggestMealTool } from '../functions/mealSuggestionTools';
import { updateInventoryTool, getInventoryTool } from "../functions/inventoryTools";
import { getUserPreferencesTool, updateUserPreferencesTool } from '../functions/preferenceTools';
import { getLeftoversTool, addLeftoverTool, updateLeftoverTool, removeLeftoverTool, showLeftoversTool } from "../functions/leftoverTools";
import { showShoppingListTool, getShoppingListTool, addToShoppingListTool, removeFromShoppingListTool } from '../functions/shoppingListTools';
import { getCurrentTimeTool } from '../functions/utilityTools';
import { updateUserNotesTool } from './notesTools';

export const tools = [{ functionDeclarations: [
    suggestMealTool,
    showShoppingListTool, 
    updateInventoryTool, 
    getInventoryTool, 
    getShoppingListTool, 
    addToShoppingListTool, 
    removeFromShoppingListTool, 
    getCurrentTimeTool,
    getUserPreferencesTool,
    updateUserPreferencesTool,
    getLeftoversTool,
    addLeftoverTool,
    updateLeftoverTool,
    removeLeftoverTool,
    showLeftoversTool,
    updateUserNotesTool,
] }];
