
import { FunctionCall } from "@google/generative-ai";
import { LeftoverItem } from "@/data/schema";
import { FunctionHandlerArgs, sanitizeDataForDisplay } from "./handlerUtils";

export const handleLeftoversCrudFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep, onGetLeftovers, onAddLeftover, onUpdateLeftover, onRemoveLeftover } = args;
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
      console.error(e);
      funcResultMsg = "I had trouble retrieving your leftovers.";
    }
  }

  // POST - Create new leftover items
  else if (functionCall.name === "createLeftoverItems") {
    try {
      const { items } = functionCall.args as { items: Omit<LeftoverItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] };
      if (onAddLeftover) {
        for (const item of items) {
          await onAddLeftover(item);
        }
        const mealNames = items.map(item => item.meal_name).join(', ');
        funcResultMsg = `I've added ${items.length} new leftover item(s): ${mealNames}.`;
      } else {
        funcResultMsg = "Leftovers function is not available right now.";
      }
    } catch (e) {
      console.error(e);
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
      if (onUpdateLeftover) {
        // For PUT, we replace all fields of the leftover
        await onUpdateLeftover(leftover_id, leftover_data);
        funcResultMsg = `I've completely replaced the leftover item with ID ${leftover_id}.`;
      } else {
        funcResultMsg = "Leftovers function is not available right now.";
      }
    } catch (e) {
      console.error(e);
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
      if (onUpdateLeftover) {
        await onUpdateLeftover(leftover_id, updates);
        const updatedFields = Object.keys(updates).join(', ');
        funcResultMsg = `I've updated the following fields for leftover ${leftover_id}: ${updatedFields}.`;
      } else {
        funcResultMsg = "Leftovers function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble updating the leftover item.";
    }
    addThoughtStep("✅ Updated leftover item");
  }

  // DELETE - Remove leftover item
  else if (functionCall.name === "deleteLeftoverItem") {
    try {
      const { leftover_id } = functionCall.args as { leftover_id: string };
      if (onRemoveLeftover) {
        await onRemoveLeftover(leftover_id);
        funcResultMsg = `I've deleted the leftover item with ID ${leftover_id}.`;
      } else {
        funcResultMsg = "Leftovers function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble deleting the leftover item.";
    }
    addThoughtStep("✅ Deleted leftover item");
  }

  return funcResultMsg;
};
