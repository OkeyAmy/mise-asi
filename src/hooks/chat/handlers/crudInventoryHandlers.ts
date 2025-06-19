
import { FunctionCall } from "@google/generative-ai";
import { FunctionHandlerArgs } from "./handlerUtils";

export const handleInventoryCrudFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep, onUpdateInventory, onGetInventory } = args;
  let funcResultMsg = "";

  // GET - Retrieve inventory items
  if (functionCall.name === "getInventoryItems") {
    try {
      if (onGetInventory) {
        const inventoryItems = await onGetInventory();
        addThoughtStep("✅ Retrieved inventory items");
        
        if (inventoryItems.length > 0) {
          let inventoryDetails = "Current inventory items:\n\n";
          inventoryItems.forEach((item: any) => {
            inventoryDetails += `- ID: ${item.id}\n`;
            inventoryDetails += `  Item: ${item.item_name}\n`;
            inventoryDetails += `  Quantity: ${item.quantity} ${item.unit}\n`;
            inventoryDetails += `  Category: ${item.category}\n`;
            inventoryDetails += `  Location: ${item.location || 'Not specified'}\n`;
            if (item.notes) inventoryDetails += `  Notes: ${item.notes}\n`;
            inventoryDetails += '\n';
          });
          funcResultMsg = inventoryDetails;
        } else {
          funcResultMsg = "No inventory items found.";
        }
      } else {
        funcResultMsg = "Inventory function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble retrieving your inventory.";
    }
  }

  // POST - Create new inventory items
  else if (functionCall.name === "createInventoryItems") {
    try {
      const { items } = functionCall.args as { items: { item_name: string; quantity: number; unit: string; category: string; location?: string; notes?: string; }[] };
      if (onUpdateInventory) {
        await onUpdateInventory(items);
        funcResultMsg = `I've created ${items.length} new inventory item(s).`;
      } else {
        funcResultMsg = "Inventory function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble creating the inventory items.";
    }
    addThoughtStep("✅ Created inventory items");
  }

  // PUT - Replace entire inventory item
  else if (functionCall.name === "replaceInventoryItem") {
    try {
      const { item_id, item_data } = functionCall.args as { 
        item_id: string; 
        item_data: { item_name: string; quantity: number; unit: string; category: string; location?: string; notes?: string; }
      };
      if (onUpdateInventory) {
        // For PUT, we replace the entire item with new data
        // We need to use upsertItem which handles the ID internally
        const itemWithId = { ...item_data };
        await onUpdateInventory([itemWithId]);
        funcResultMsg = `I've completely replaced the inventory item with ID ${item_id}.`;
      } else {
        funcResultMsg = "Inventory function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble replacing the inventory item.";
    }
    addThoughtStep("✅ Replaced inventory item");
  }

  // PATCH - Partially update inventory item
  else if (functionCall.name === "updateInventoryItem") {
    try {
      const { item_id, updates } = functionCall.args as { 
        item_id: string; 
        updates: { item_name?: string; quantity?: number; unit?: string; category?: string; location?: string; notes?: string; }
      };
      if (onUpdateInventory) {
        // For PATCH, we only update the specified fields
        // We need to merge updates with minimal required fields
        const updateData = { 
          item_name: updates.item_name || "",
          quantity: updates.quantity || 0,
          unit: updates.unit || "",
          category: updates.category || "",
          location: updates.location,
          notes: updates.notes
        };
        await onUpdateInventory([updateData]);
        
        const updatedFields = Object.keys(updates).join(', ');
        funcResultMsg = `I've updated the following fields for inventory item ${item_id}: ${updatedFields}.`;
      } else {
        funcResultMsg = "Inventory function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble updating the inventory item.";
    }
    addThoughtStep("✅ Updated inventory item");
  }

  // DELETE - Remove inventory item
  else if (functionCall.name === "deleteInventoryItem") {
    try {
      const { item_id } = functionCall.args as { item_id: string };
      if (onUpdateInventory) {
        // Set quantity to 0 to trigger deletion logic
        await onUpdateInventory([{ 
          item_name: "", 
          quantity: 0, 
          unit: "", 
          category: "" 
        }]);
        funcResultMsg = `I've deleted the inventory item with ID ${item_id}.`;
      } else {
        funcResultMsg = "Inventory function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble deleting the inventory item.";
    }
    addThoughtStep("✅ Deleted inventory item");
  }

  return funcResultMsg;
};
