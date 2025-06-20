
import { FunctionCall } from "@google/generative-ai";
import { LeftoverItem } from "@/data/schema";
import { FunctionHandlerArgs, sanitizeDataForDisplay } from "./handlerUtils";

export const handleLeftoversCrudFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { 
    addThoughtStep, 
    onGetLeftovers, 
    onCreateLeftoverItems,
    onUpdateLeftoverItemPartial, 
    onDeleteLeftoverItem,
    // Fallback to legacy handlers if CRUD not available
    onAddLeftover, 
    onUpdateLeftover, 
    onRemoveLeftover 
  } = args;
  
  console.log("🔧 CRUD Leftovers Handler Called:", functionCall.name);
  console.log("🔧 Available callbacks:", {
    onGetLeftovers: !!onGetLeftovers,
    onCreateLeftoverItems: !!onCreateLeftoverItems,
    onUpdateLeftoverItemPartial: !!onUpdateLeftoverItemPartial,
    onDeleteLeftoverItem: !!onDeleteLeftoverItem,
  });
  
  let funcResultMsg = "";

  // GET - Retrieve leftover items
  if (functionCall.name === "getLeftoverItems") {
    try {
      if (onGetLeftovers) {
        const leftovers = await onGetLeftovers();
        addThoughtStep("✅ Retrieved leftover items");
        
        if (leftovers.length > 0) {
          const sanitizedData = sanitizeDataForDisplay(leftovers);
          let leftoverDetails = "Current leftover items:\n\n";
          sanitizedData.forEach((item: any) => {
            leftoverDetails += `- ID: ${item.id}\n`;
            leftoverDetails += `  Meal: ${item.meal_name}\n`;
            leftoverDetails += `  Servings: ${item.servings}\n`;
            leftoverDetails += `  Date Created: ${new Date(item.date_created).toLocaleDateString()}\n`;
            if (item.notes) leftoverDetails += `  Notes: ${item.notes}\n`;
            leftoverDetails += '\n';
          });
          funcResultMsg = leftoverDetails;
        } else {
          funcResultMsg = "No leftover items found.";
        }
      } else {
        funcResultMsg = "Leftovers function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error getting leftovers:", e);
      funcResultMsg = "I had trouble retrieving your leftovers.";
    }
  }

  // POST - Create new leftover items
  else if (functionCall.name === "createLeftoverItems") {
    try {
      const { items } = functionCall.args as { items: Omit<LeftoverItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] };
      console.log("📝 Creating leftover items:", items);
      
      if (onCreateLeftoverItems) {
        await onCreateLeftoverItems(items);
        const mealNames = items.map(item => item.meal_name).join(', ');
        funcResultMsg = `I've added ${items.length} new leftover item(s): ${mealNames}. You can see them in your leftovers now.`;
        console.log("✅ Successfully created leftover items");
      } else if (onAddLeftover) {
        // Fallback to legacy handler
        for (const item of items) {
          await onAddLeftover(item);
        }
        const mealNames = items.map(item => item.meal_name).join(', ');
        funcResultMsg = `I've added ${items.length} new leftover item(s): ${mealNames}. You can see them in your leftovers now.`;
        console.log("✅ Successfully created leftover items via fallback");
      } else {
        console.log("❌ No leftover creation callbacks available");
        funcResultMsg = "Leftovers function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error creating leftover items:", e);
      funcResultMsg = "I had trouble adding the leftover items.";
    }
    addThoughtStep("✅ Created leftover items");
  }

  // PUT - Replace entire leftover item
  else if (functionCall.name === "replaceLeftoverItem") {
    try {
      const { leftover_id, leftover_data } = functionCall.args as { 
        leftover_id: string; 
        leftover_data: { meal_name: string; servings: number; notes?: string; }
      };
      console.log("🔄 Replacing entire leftover item:", { leftover_id, leftover_data });
      
      if (onUpdateLeftoverItemPartial) {
        // For PUT, we replace all fields of the leftover
        await onUpdateLeftoverItemPartial(leftover_id, leftover_data);
        funcResultMsg = `I've completely replaced the leftover item with ID ${leftover_id}. The changes are now visible in your leftovers.`;
        console.log("✅ Successfully replaced leftover item");
      } else if (onUpdateLeftover) {
        // Fallback to legacy handler
        await onUpdateLeftover(leftover_id, leftover_data);
        funcResultMsg = `I've completely replaced the leftover item with ID ${leftover_id}. The changes are now visible in your leftovers.`;
        console.log("✅ Successfully replaced leftover item via fallback");
      } else {
        console.log("❌ No leftover update callbacks available");
        funcResultMsg = "Leftovers function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error replacing leftover item:", e);
      funcResultMsg = "I had trouble replacing the leftover item.";
    }
    addThoughtStep("✅ Replaced leftover item");
  }

  // PATCH - Partially update leftover item
  else if (functionCall.name === "updateLeftoverItemPartial") {
    try {
      const { leftover_id, updates } = functionCall.args as { 
        leftover_id: string; 
        updates: { meal_name?: string; servings?: number; notes?: string; }
      };
      console.log("📝 Updating leftover item:", { leftover_id, updates });
      
      if (onUpdateLeftoverItemPartial) {
        await onUpdateLeftoverItemPartial(leftover_id, updates);
        const updatedFields = Object.keys(updates).join(', ');
        funcResultMsg = `I've updated the following fields for leftover ${leftover_id}: ${updatedFields}. You can see the changes in your leftovers now.`;
        console.log("✅ Successfully updated leftover item");
      } else if (onUpdateLeftover) {
        // Fallback to legacy handler
        await onUpdateLeftover(leftover_id, updates);
        const updatedFields = Object.keys(updates).join(', ');
        funcResultMsg = `I've updated the following fields for leftover ${leftover_id}: ${updatedFields}. You can see the changes in your leftovers now.`;
        console.log("✅ Successfully updated leftover item via fallback");
      } else {
        console.log("❌ No leftover update callbacks available");
        funcResultMsg = "Leftovers function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error updating leftover item:", e);
      funcResultMsg = "I had trouble updating the leftover item.";
    }
    addThoughtStep("✅ Updated leftover item");
  }

  // DELETE - Remove leftover item
  else if (functionCall.name === "deleteLeftoverItem") {
    try {
      const { leftover_id } = functionCall.args as { leftover_id: string };
      console.log("🗑️ Deleting leftover item:", leftover_id);
      
      if (onDeleteLeftoverItem) {
        await onDeleteLeftoverItem(leftover_id);
        funcResultMsg = `I've deleted the leftover item with ID ${leftover_id}. It has been removed from your leftovers.`;
        console.log("✅ Successfully deleted leftover item");
      } else if (onRemoveLeftover) {
        // Fallback to legacy handler
        await onRemoveLeftover(leftover_id);
        funcResultMsg = `I've deleted the leftover item with ID ${leftover_id}. It has been removed from your leftovers.`;
        console.log("✅ Successfully deleted leftover item via fallback");
      } else {
        console.log("❌ No leftover delete callbacks available");
        funcResultMsg = "Leftovers function is not available right now.";
      }
    } catch (e) {
      console.error("❌ Error deleting leftover item:", e);
      funcResultMsg = "I had trouble deleting the leftover item.";
    }
    addThoughtStep("✅ Deleted leftover item");
  }

  console.log("🏁 CRUD Leftovers Handler Result:", funcResultMsg);
  return funcResultMsg;
};
