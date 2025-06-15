
import { FunctionCall } from "@google/generative-ai";
import { getFormattedUserTime } from "@/lib/time";
import { FunctionHandlerArgs } from "./handlerUtils";

export const handleUtilityFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep } = args;
  let funcResultMsg = "";

  if (functionCall.name === "getCurrentTime") {
    funcResultMsg = `The current time is ${getFormattedUserTime()}.`;
    addThoughtStep("✅ Executed: getCurrentTime");
  }

  return funcResultMsg;
};
