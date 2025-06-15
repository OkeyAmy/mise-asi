
import { FunctionCall } from "@google/generative-ai";
import { UserPreferences } from "@/data/schema";
import { FunctionHandlerArgs, sanitizeDataForDisplay } from "./handlerUtils";

export const handlePreferenceFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep, onGetUserPreferences, onUpdateUserPreferences } = args;
  let funcResultMsg = "";

  if (functionCall.name === "getUserPreferences") {
    try {
      if (onGetUserPreferences) {
        const preferences = await onGetUserPreferences();
        const sanitizedData = sanitizeDataForDisplay(preferences);
        addThoughtStep(
          "🔨 Preparing to call function: getUserPreferences",
          JSON.stringify(sanitizedData, null, 2),
          "completed"
        );
        if (preferences) {
          funcResultMsg = "I've retrieved your current preferences and will use them to help you better.";
        } else {
          funcResultMsg = "No preferences found. Feel free to tell me about your dietary restrictions, goals, and preferences!";
        }
      } else {
        funcResultMsg = "Preferences function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble fetching your preferences.";
    }
    addThoughtStep("✅ Executed: getUserPreferences");
  } else if (functionCall.name === "updateUserPreferences") {
    try {
      const updates = functionCall.args as Partial<UserPreferences>;
      if (onUpdateUserPreferences) {
        await onUpdateUserPreferences(updates);
        funcResultMsg = "I've updated your preferences. I'll keep this information in mind for future recommendations.";
      } else {
        funcResultMsg = "Preferences function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble updating your preferences.";
    }
    addThoughtStep("✅ Executed: updateUserPreferences");
  }

  return funcResultMsg;
};
