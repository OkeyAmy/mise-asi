
import { FunctionCall } from "@google/generative-ai";
import { FunctionHandlerArgs, sanitizeDataForDisplay } from "./handlerUtils";

export const handleInventoryFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep, onUpdateInventory, onGetInventory } = args;
  let funcResultMsg = "";

  if (functionCall.name === "updateInventory") {
    try {
      const { items } = functionCall.args as { items: { item_name: string; quantity: number; unit: string; category: string; location?: string; notes?: string; }[] };
      if (onUpdateInventory) {
        await onUpdateInventory(items);
        funcResultMsg = "I've updated your inventory with the new items.";
      } else {
        funcResultMsg = "Inventory function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble updating your inventory.";
    }
    addThoughtStep("✅ Executed: updateInventory");
  } else if (functionCall.name === "getInventory") {
    try {
      if (onGetInventory) {
        const inventoryItems = await onGetInventory();
        const sanitizedData = sanitizeDataForDisplay(inventoryItems);
        addThoughtStep(
          "🔨 Preparing to call function: getInventory",
          JSON.stringify(sanitizedData, null, 2),
          "completed"
        );
        if (inventoryItems.length > 0) {
          funcResultMsg = "Here is your current inventory:\n" + inventoryItems.map(item => `- ${item.quantity} ${item.unit} of ${item.item_name}`).join('\n');
        } else {
          funcResultMsg = "Your inventory is currently empty.";
        }
      } else {
        funcResultMsg = "Inventory function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble fetching your inventory.";
    }
    addThoughtStep("✅ Executed: getInventory");
  }

  return funcResultMsg;
};
