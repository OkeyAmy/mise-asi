
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
        const prefs = await onGetUserPreferences();
        const sanitizedData = sanitizeDataForDisplay(prefs);
        addThoughtStep(
          "🔨 Preparing to call function: getUserPreferences",
          JSON.stringify(sanitizedData, null, 2),
          "completed"
        );
        
        if (prefs) {
          let prefsSummary = "";
          let hasAnyPreferences = false;
          
          if (prefs.goals && prefs.goals.length > 0) {
            prefsSummary += `- Goals: ${prefs.goals.join(', ')}\n`;
            hasAnyPreferences = true;
          }
          if (prefs.restrictions && prefs.restrictions.length > 0) {
            prefsSummary += `- Dietary Restrictions: ${prefs.restrictions.join(', ')}\n`;
            hasAnyPreferences = true;
          }
          if (prefs.swap_preferences?.preferred_cuisines && prefs.swap_preferences.preferred_cuisines.length > 0) {
            prefsSummary += `- Preferred Cuisines: ${prefs.swap_preferences.preferred_cuisines.join(', ')}\n`;
            hasAnyPreferences = true;
          }
          if (prefs.swap_preferences?.disliked_ingredients && prefs.swap_preferences.disliked_ingredients.length > 0) {
            prefsSummary += `- Disliked Ingredients: ${prefs.swap_preferences.disliked_ingredients.join(', ')}\n`;
            hasAnyPreferences = true;
          }
          if (prefs.cultural_heritage) {
            prefsSummary += `- Cultural Background: ${prefs.cultural_heritage}\n`;
            hasAnyPreferences = true;
          }
          if (prefs.family_size) {
            prefsSummary += `- Family Size: ${prefs.family_size} people\n`;
            hasAnyPreferences = true;
          }
          if (prefs.notes && prefs.notes.trim()) {
            prefsSummary += `- Notes: ${prefs.notes}\n`;
            hasAnyPreferences = true;
          }
          if (prefs.key_info && typeof prefs.key_info === 'object' && Object.keys(prefs.key_info).length > 0) {
            prefsSummary += "- Additional Information:\n";
            for (const [key, value] of Object.entries(prefs.key_info as Record<string, any>)) {
              if (value !== null && value !== undefined && value !== '') {
                prefsSummary += `  - ${key.replace(/_/g, ' ')}: ${value}\n`;
                hasAnyPreferences = true;
              }
            }
          }
          
          if (hasAnyPreferences) {
            funcResultMsg = "Here's what I know about you based on your saved preferences:\n" + prefsSummary.trim();
          } else {
            funcResultMsg = "I don't have any specific preferences saved for you yet. Feel free to tell me about your dietary restrictions, goals, cultural background, family size, or any other preferences you'd like me to remember!";
          }
        } else {
          funcResultMsg = "I don't have any preferences saved for you yet. Feel free to tell me about your dietary restrictions, goals, cultural background, family size, or any other preferences you'd like me to remember!";
        }
      } else {
        funcResultMsg = "Preference feature is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble accessing your preferences.";
    }
    addThoughtStep("✅ Executed: getUserPreferences");
  } else if (functionCall.name === "updateUserPreferences") {
    try {
      if (onUpdateUserPreferences) {
        await onUpdateUserPreferences(functionCall.args as Partial<UserPreferences>);
        funcResultMsg = "I've updated your preferences and will remember this information for future meal suggestions.";
      } else {
        funcResultMsg = "Preference feature is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble updating your preferences.";
    }
    addThoughtStep("✅ Executed: updateUserPreferences");
  } else if (functionCall.name === "updateUserNotes") {
    try {
      if (onUpdateUserPreferences && onGetUserPreferences) {
        addThoughtStep("📝 Updating user notes...");
        const { notes: newNote } = functionCall.args as { notes: string };
        const existingPrefs = await onGetUserPreferences();
        const existingNotes = existingPrefs?.notes || "";
        const updatedNotes = existingNotes ? `${existingNotes}\n- ${newNote}` : `- ${newNote}`;
        
        await onUpdateUserPreferences({ notes: updatedNotes });
        funcResultMsg = "I've made a note of that for you.";
      } else {
        funcResultMsg = "I'm sorry, I can't make notes right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble saving that note.";
    }
    addThoughtStep("✅ Executed: updateUserNotes");
  }

  return funcResultMsg;
};
