
import { FunctionCall } from "@google/generative-ai";
import { MealPlan, ShoppingListItem, UserPreferences, LeftoverItem } from "@/data/schema";
import { getFormattedUserTime } from "@/lib/time";
import { UseChatProps } from "./types";

type AddThoughtStep = (
  step: string,
  details?: string,
  status?: "pending" | "active" | "completed"
) => void;

type FunctionHandlerArgs = Omit<UseChatProps, 'apiKey' | 'onApiKeyMissing' | 'setThoughtSteps'> & {
  addThoughtStep: AddThoughtStep;
};

export const handleFunctionCall = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
    const { 
        addThoughtStep,
        setPlan,
        setIsShoppingListOpen,
        onUpdateShoppingList,
        onUpdateInventory,
        onGetInventory,
        shoppingListItems,
        onAddItemsToShoppingList,
        onRemoveItemsFromShoppingList,
        onGetUserPreferences,
        onUpdateUserPreferences,
        setIsLeftoversOpen,
        onGetLeftovers,
        onAddLeftover,
        onUpdateLeftover,
        onRemoveLeftover,
     } = args;

  let funcResultMsg = "";
  if (functionCall.name === "suggestMeal") {
    funcResultMsg = "I have a meal suggestion for you. I will present it now.";
    addThoughtStep("✅ Executed: suggestMeal");
  } else if (functionCall.name === "updateMealPlan") {
    const newPlan = functionCall.args as MealPlan;
    setPlan(newPlan);
    funcResultMsg = "Meal plan updated successfully.";
    addThoughtStep("✅ Executed: updateMealPlan");
  } else if (functionCall.name === "showShoppingList") {
    try {
      const plan = functionCall.args as MealPlan;
      let allIngredients: ShoppingListItem[] = [];
      if (plan?.days) {
        const allIng = new Map<string, ShoppingListItem>();
        plan.days.forEach((day) => {
          Object.values(day.meals).forEach((meal) => {
            meal.ingredients.forEach((ing) => {
              if (allIng.has(ing.item)) {
                const existing = allIng.get(ing.item)!;
                existing.quantity += ing.quantity;
              } else {
                allIng.set(ing.item, { ...ing });
              }
            });
          });
        });
        allIngredients = Array.from(allIng.values());
      }
      if(onUpdateShoppingList) {
        onUpdateShoppingList(allIngredients);
      }
      funcResultMsg = "Shopping list updated and shown!";
    } catch {
      funcResultMsg = "Couldn't extract shopping list from plan.";
    }
    setIsShoppingListOpen(true);
    addThoughtStep("✅ Executed: showShoppingList");
  } else if (functionCall.name === "updateInventory") {
    try {
      const { items } = functionCall.args as { items: { item_name: string; quantity: number; unit: string; category: string; location?: string; notes?: string; }[] };
      if (onUpdateInventory) {
        await onUpdateInventory(items);
        funcResultMsg = "I've updated your inventory with the new items.";
      } else {
        funcResultMsg = "Inventory function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble updating your inventory.";
    }
    addThoughtStep("✅ Executed: updateInventory");
  } else if (functionCall.name === "getInventory") {
    try {
      if (onGetInventory) {
        const inventoryItems = await onGetInventory();
        if (inventoryItems.length > 0) {
          funcResultMsg = "Here is your current inventory:\n" + inventoryItems.map(item => `- ${item.quantity} ${item.unit} of ${item.item_name}`).join('\n');
        } else {
          funcResultMsg = "Your inventory is currently empty.";
        }
      } else {
        funcResultMsg = "Inventory function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble fetching your inventory.";
    }
    addThoughtStep("✅ Executed: getInventory");
  } else if (functionCall.name === "getShoppingList") {
    if (shoppingListItems && shoppingListItems.length > 0) {
      funcResultMsg = "Here is your current shopping list:\n" + shoppingListItems.map(item => `- ${item.quantity} ${item.unit} of ${item.item}`).join('\n');
    } else {
      funcResultMsg = "Your shopping list is currently empty.";
    }
    setIsShoppingListOpen(true);
    addThoughtStep("✅ Executed: getShoppingList");
  } else if (functionCall.name === "addToShoppingList") {
    try {
      const { items } = functionCall.args as { items: ShoppingListItem[] };
      if (onAddItemsToShoppingList) {
        await onAddItemsToShoppingList(items);
        funcResultMsg = "I've added the items to your shopping list.";
      } else {
        funcResultMsg = "Shopping list function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble adding items to your shopping list.";
    }
    addThoughtStep("✅ Executed: addToShoppingList");
  } else if (functionCall.name === "removeFromShoppingList") {
    try {
      const { item_names } = functionCall.args as { item_names: string[] };
      if (onRemoveItemsFromShoppingList) {
        await onRemoveItemsFromShoppingList(item_names);
        funcResultMsg = "I've removed the items from your shopping list.";
      } else {
        funcResultMsg = "Shopping list function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble removing items from your shopping list.";
    }
    addThoughtStep("✅ Executed: removeFromShoppingList");
  } else if (functionCall.name === "getCurrentTime") {
    funcResultMsg = `The current time is ${getFormattedUserTime()}.`;
    addThoughtStep("✅ Executed: getCurrentTime");
  } else if (functionCall.name === "showLeftovers") {
    setIsLeftoversOpen(true);
    funcResultMsg = "I've opened your leftovers list.";
    addThoughtStep("✅ Executed: showLeftovers");
  } else if (functionCall.name === "getLeftovers") {
    try {
      const leftovers = await onGetLeftovers();
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
  } else if (functionCall.name === "getUserPreferences") {
    try {
      if (onGetUserPreferences) {
        const prefs = await onGetUserPreferences();
        if (prefs) {
          // Only include data that actually exists in the database
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
  }
  return funcResultMsg;
};
