
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
      const { leftover_id } = functionCall.args as { leftover_id: string };
      if (onRemoveLeftover) {
        await onRemoveLeftover(leftover_id);
        funcResultMsg = "I've removed the leftover.";
      } else {
        funcResultMsg = "Leftovers function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble removing the leftover.";
    }
    addThoughtStep("✅ Executed: removeLeftover");
  }

  return funcResultMsg;
};
