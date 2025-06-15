
import { FunctionCall } from "@google/generative-ai";
import { LeftoverItem } from "@/data/schema";
import { FunctionHandlerArgs, sanitizeDataForDisplay } from "./handlerUtils";

export const handleLeftoverFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep, setIsLeftoversOpen, onGetLeftovers, onAddLeftover, onUpdateLeftover, onRemoveLeftover } = args;
  let funcResultMsg = "";

  if (functionCall.name === "showLeftovers") {
    setIsLeftoversOpen(true);
    funcResultMsg = "I've opened your leftovers for you.";
    addThoughtStep("✅ Executed: showLeftovers");
  } else if (functionCall.name === "getLeftovers") {
    try {
      if (onGetLeftovers) {
        const leftovers = await onGetLeftovers();
        const sanitizedData = sanitizeDataForDisplay(leftovers);
        addThoughtStep(
          "🔨 Preparing to call function: getLeftovers",
          JSON.stringify(sanitizedData, null, 2),
          "completed"
        );
        if (leftovers.length > 0) {
          funcResultMsg = "Here are your current leftovers:\n" + leftovers.map(item => `- ${item.meal_name} (${item.servings} servings)`).join('\n');
        } else {
          funcResultMsg = "You have no leftovers. Good job!";
        }
      } else {
        funcResultMsg = "Leftovers function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble fetching your leftovers.";
    }
    addThoughtStep("✅ Executed: getLeftovers");
  } else if (functionCall.name === "addLeftover") {
    try {
      const leftoverData = functionCall.args as Omit<LeftoverItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'date_created'> & { date_created?: string };
      if (onAddLeftover) {
        await onAddLeftover(leftoverData);
        funcResultMsg = `I've added ${leftoverData.meal_name} to your leftovers.`;
      } else {
        funcResultMsg = "Leftovers function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble adding the leftover.";
    }
    addThoughtStep("✅ Executed: addLeftover");
  } else if (functionCall.name === "adjustLeftoverServings") {
    try {
      const { meal_name, serving_adjustment } = functionCall.args as { meal_name: string; serving_adjustment: number };
      
      if (!onGetLeftovers || !onUpdateLeftover || !onRemoveLeftover) {
        funcResultMsg = "Leftovers function is not available right now.";
      } else {
        // Get current leftovers to find the item
        const leftovers = await onGetLeftovers();
        const itemToAdjust = leftovers.find(item => item.meal_name.toLowerCase() === meal_name.toLowerCase());
        
        if (itemToAdjust) {
          const newServings = itemToAdjust.servings + serving_adjustment;
          
          if (newServings <= 0) {
            // Remove the item if servings go to 0 or below
            await onRemoveLeftover(itemToAdjust.id);
            funcResultMsg = `I've removed '${meal_name}' from your leftovers since you've finished it.`;
          } else {
            // Update the serving count
            await onUpdateLeftover(itemToAdjust.id, { servings: newServings });
            const action = serving_adjustment > 0 ? "added" : "removed";
            const amount = Math.abs(serving_adjustment);
            funcResultMsg = `I've ${action} ${amount} serving${amount !== 1 ? 's' : ''} ${serving_adjustment > 0 ? 'to' : 'from'} your ${meal_name} leftovers. You now have ${newServings} serving${newServings !== 1 ? 's' : ''} left.`;
          }
        } else {
          funcResultMsg = `I couldn't find a leftover item named '${meal_name}'.`;
        }
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble adjusting the leftover servings.";
    }
    addThoughtStep("✅ Executed: adjustLeftoverServings");
  } else if (functionCall.name === "updateLeftover") {
    try {
      const { leftover_id, servings, notes } = functionCall.args as { leftover_id: string; servings?: number; notes?: string };
      if (onUpdateLeftover) {
        const updates: Partial<{ servings: number; notes: string }> = {};
        if (servings !== undefined) updates.servings = servings;
        if (notes !== undefined) updates.notes = notes;
        await onUpdateLeftover(leftover_id, updates);
        funcResultMsg = "I've updated the leftover.";
      } else {
        funcResultMsg = "Leftovers function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble updating the leftover.";
    }
    addThoughtStep("✅ Executed: updateLeftover");
  } else if (functionCall.name === "removeLeftover") {
    try {
      const { leftover_id, meal_name } = functionCall.args as { leftover_id?: string; meal_name?: string };

      if (!onRemoveLeftover || !onGetLeftovers) {
          funcResultMsg = "Leftovers function is not available right now.";
      } else if (leftover_id) {
          await onRemoveLeftover(leftover_id);
          funcResultMsg = "I've removed the leftover.";
      } else if (meal_name) {
          const leftovers = await onGetLeftovers();
          const itemToRemove = leftovers.find(item => item.meal_name.toLowerCase() === meal_name.toLowerCase());
          
          if (itemToRemove) {
              await onRemoveLeftover(itemToRemove.id);
              funcResultMsg = `I've completely removed '${meal_name}' from your leftovers.`;
          } else {
              funcResultMsg = `I couldn't find a leftover item named '${meal_name}'.`;
          }
      } else {
          funcResultMsg = "You need to tell me which leftover to remove, either by name or ID.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble removing the leftover.";
    }
    addThoughtStep("✅ Executed: removeLeftover");
  }

  return funcResultMsg;
};
