
import { FunctionCall } from "@google/generative-ai";
import { MealPlan } from "@/data/schema";
import { FunctionHandlerArgs } from "./handlerUtils";

export const handleMealFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep, setPlan } = args;
  let funcResultMsg = "";

  if (functionCall.name === "suggestMeal") {
    funcResultMsg = "I have a meal suggestion for you. I will present it now.";
    addThoughtStep("✅ Executed: suggestMeal");
  } else if (functionCall.name === "updateMealPlan") {
    const newPlan = functionCall.args as MealPlan;
    setPlan(newPlan);
    funcResultMsg = "Meal plan updated successfully.";
    addThoughtStep("✅ Executed: updateMealPlan");
  }
  return funcResultMsg;
};
