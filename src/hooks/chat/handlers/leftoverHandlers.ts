
import { FunctionCall } from "@google/generative-ai";
import { LeftoverItem } from "@/data/schema";
import { FunctionHandlerArgs, sanitizeDataForDisplay } from "./handlerUtils";

export const handleLeftoverFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const {
    addThoughtStep,
    setIsLeftoversOpen,
    onGetLeftovers,
    onAddLeftover,
    onUpdateLeftover,
    onRemoveLeftover,
  } = args;
  let funcResultMsg = "";

  if (functionCall.name === "showLeftovers") {
    setIsLeftoversOpen(true);
    funcResultMsg = "I've opened your leftovers list.";
    addThoughtStep("✅ Executed: showLeftovers");
  } else if (functionCall.name === "getLeftovers") {
    try {
      const leftovers = await onGetLeftovers();
      const sanitizedData = sanitizeDataForDisplay(leftovers);
      addThoughtStep(
        "🔨 Preparing to call function: getLeftovers",
        JSON.stringify(sanitizedData, null, 2),
        "completed"
      );
      if (leftovers.length > 0) {
        funcResultMsg = "Here are your current leftovers:\n" + leftovers.map(item => `- ${item.servings} serving(s) of ${item.meal_name} (ID: ${item.id})`).join('\n');
      } else {
        funcResultMsg = "You have no leftovers.";
      }
    } catch (e) {
        console.error(e);
        funcResultMsg = "I had trouble getting your leftovers.";
    }
    addThoughtStep("✅ Executed: getLeftovers");
  } else if (functionCall.name === "addLeftover") {
    try {
      await onAddLeftover(functionCall.args as Omit<LeftoverItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'date_created'>);
      funcResultMsg = "I've added the meal to your leftovers.";
    } catch(e) {
      console.error(e);
      funcResultMsg = "I had trouble adding that to your leftovers.";
    }
    addThoughtStep("✅ Executed: addLeftover");
  } else if (functionCall.name === "updateLeftover") {
    try {
        const { leftover_id, ...updates } = functionCall.args as { leftover_id: string; servings?: number; notes?: string };
        if (updates.servings !== undefined && updates.servings <= 0) {
            await onRemoveLeftover(leftover_id);
            funcResultMsg = "I've removed the leftover since there are no servings left.";
        } else {
            await onUpdateLeftover(leftover_id, updates);
            funcResultMsg = "I've updated the leftover item.";
        }
    } catch(e) {
        console.error(e);
        funcResultMsg = "I had trouble updating that leftover.";
    }
    addThoughtStep("✅ Executed: updateLeftover");
  } else if (functionCall.name === "removeLeftover") {
    try {
        const { leftover_id } = functionCall.args as { leftover_id: string };
        await onRemoveLeftover(leftover_id);
        funcResultMsg = "I've removed the leftover item.";
    } catch(e) {
        console.error(e);
        funcResultMsg = "I had trouble removing that leftover.";
    }
    addThoughtStep("✅ Executed: removeLeftover");
  }
  
  return funcResultMsg;
};
