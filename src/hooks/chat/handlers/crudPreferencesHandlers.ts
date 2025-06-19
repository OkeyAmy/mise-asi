
import { FunctionCall } from "@google/generative-ai";
import { UserPreferences } from "@/data/schema";
import { FunctionHandlerArgs, sanitizeDataForDisplay } from "./handlerUtils";

export const handlePreferencesCrudFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep, onGetUserPreferences, onUpdateUserPreferences } = args;
  let funcResultMsg = "";

  // GET - Retrieve user preferences
  if (functionCall.name === "getUserPreferencesData") {
    try {
      if (onGetUserPreferences) {
        const preferences = await onGetUserPreferences();
        addThoughtStep("✅ Retrieved user preferences");
        
        if (preferences) {
          const sanitizedData = sanitizeDataForDisplay(preferences);
          funcResultMsg = `User preferences data:
ID: ${sanitizedData.id}
Dietary Restrictions: ${JSON.stringify(sanitizedData.restrictions)}
Health Goals: ${JSON.stringify(sanitizedData.goals)}
Eating Habits: ${JSON.stringify(sanitizedData.habits)}
Cultural Heritage: ${sanitizedData.cultural_heritage || 'Not specified'}
Family Size: ${sanitizedData.family_size || 'Not specified'}
Swap Preferences: ${JSON.stringify(sanitizedData.swap_preferences)}
Meal Ratings: ${JSON.stringify(sanitizedData.meal_ratings)}
Notes: ${sanitizedData.notes || 'No notes'}
Key Info: ${JSON.stringify(sanitizedData.key_info)}`;
        } else {
          funcResultMsg = "No user preferences found.";
        }
      } else {
        funcResultMsg = "Preferences function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble retrieving your preferences.";
    }
  }

  // POST - Create new user preferences (typically used for initialization)
  else if (functionCall.name === "createUserPreferences") {
    try {
      const preferencesData = functionCall.args as Partial<UserPreferences>;
      if (onUpdateUserPreferences) {
        await onUpdateUserPreferences(preferencesData);
        funcResultMsg = "I've created your user preferences profile.";
      } else {
        funcResultMsg = "Preferences function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble creating your preferences.";
    }
    addThoughtStep("✅ Created user preferences");
  }

  // PUT - Replace entire preferences profile
  else if (functionCall.name === "replaceUserPreferences") {
    try {
      const preferencesData = functionCall.args as Partial<UserPreferences>;
      if (onUpdateUserPreferences) {
        // For PUT, we replace all user preferences with new data
        await onUpdateUserPreferences(preferencesData);
        funcResultMsg = "I've completely replaced your preferences profile.";
      } else {
        funcResultMsg = "Preferences function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble replacing your preferences.";
    }
    addThoughtStep("✅ Replaced user preferences");
  }

  // PATCH - Partially update user preferences
  else if (functionCall.name === "updateUserPreferencesPartial") {
    try {
      const updates = functionCall.args as Partial<UserPreferences>;
      if (onUpdateUserPreferences) {
        await onUpdateUserPreferences(updates);
        const updatedFields = Object.keys(updates).join(', ');
        funcResultMsg = `I've updated the following preference fields: ${updatedFields}.`;
      } else {
        funcResultMsg = "Preferences function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble updating your preferences.";
    }
    addThoughtStep("✅ Updated user preferences");
  }

  // DELETE - Remove specific preference fields (set to null/default)
  else if (functionCall.name === "deleteUserPreferenceFields") {
    try {
      const { fields } = functionCall.args as { fields: string[] };
      if (onUpdateUserPreferences) {
        const resetData: Partial<UserPreferences> = {};
        fields.forEach(field => {
          switch (field) {
            case 'restrictions':
            case 'goals':
            case 'habits':
            case 'inventory':
              (resetData as any)[field] = [];
              break;
            case 'meal_ratings':
            case 'key_info':
              (resetData as any)[field] = {};
              break;
            case 'swap_preferences':
              (resetData as any)[field] = {
                swap_frequency: "medium",
                preferred_cuisines: [],
                disliked_ingredients: []
              };
              break;
            default:
              (resetData as any)[field] = null;
          }
        });
        
        await onUpdateUserPreferences(resetData);
        funcResultMsg = `I've reset the following preference fields: ${fields.join(', ')}.`;
      } else {
        funcResultMsg = "Preferences function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble resetting your preference fields.";
    }
    addThoughtStep("✅ Reset user preference fields");
  }

  return funcResultMsg;
};
