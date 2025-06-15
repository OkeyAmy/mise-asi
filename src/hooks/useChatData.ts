
import { Session } from "@supabase/supabase-js";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useInventory } from "@/hooks/useInventory";
import { usePreferences } from "@/hooks/usePreferences";
import { useLeftovers } from "@/hooks/useLeftovers";

export function useChatData(session: Session | null, mealPlanId: string | undefined) {
  const {
    items: shoppingListItems,
    isLoading: isListLoading,
    removeItem,
    removeItems,
    addItems,
    saveList,
  } = useShoppingList(session, mealPlanId);

  const { items: inventoryItems, upsertItem } = useInventory(session, (item) => {
    if (confirm(`You've run out of ${item.item_name}. Would you like to add it to your shopping list?`)) {
      addItems([{
        item: item.item_name,
        quantity: 1,
        unit: item.unit
      }]);
    }
  });

  const { preferences, updatePreferences } = usePreferences(session);

  const {
    items: leftoverItems,
    isLoading: isLeftoversLoading,
    addLeftover,
    updateLeftover,
    removeLeftover,
    getLeftovers,
  } = useLeftovers(session);

  return {
    shoppingList: {
      items: shoppingListItems,
      isLoading: isListLoading,
      removeItem,
      removeItems,
      addItems,
      saveList,
    },
    inventory: {
      items: inventoryItems,
      upsertItem,
    },
    preferences: {
      data: preferences,
      update: updatePreferences,
    },
    leftovers: {
      items: leftoverItems,
      isLoading: isLeftoversLoading,
      add: addLeftover,
      update: updateLeftover,
      remove: removeLeftover,
      get: getLeftovers,
    },
  };
}
