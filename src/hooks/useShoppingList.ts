import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingListItem } from "@/data/schema";
import { Session } from "@supabase/supabase-js";

export function useShoppingList(session: Session | null, mealPlanId: string) {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the user's shopping list
  const fetchList = useCallback(async () => {
    if (!session?.user.id) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from("shopping_lists")
      .select("items, id")
      .eq("user_id", session.user.id)
      .eq("meal_plan_id", mealPlanId)
      .maybeSingle();

    if (data && Array.isArray(data.items)) {
      setItems(data.items as unknown as ShoppingListItem[]);
    } else {
      setItems([]);
    }
    setIsLoading(false);
  }, [session, mealPlanId]);

  // Remove multiple items from the shopping list
  const removeItems = async (itemNames: string[]) => {
    if (!session?.user.id || itemNames.length === 0) return;
    const { data, error } = await supabase
      .from("shopping_lists")
      .select("id, items")
      .eq("user_id", session.user.id)
      .eq("meal_plan_id", mealPlanId)
      .maybeSingle();

    if (data && Array.isArray(data.items)) {
      const lowerCaseItemNames = itemNames.map(name => name.toLowerCase());
      const filtered = (data.items as unknown as ShoppingListItem[]).filter((i: ShoppingListItem) => !lowerCaseItemNames.includes(i.item.toLowerCase()));
      await supabase
        .from("shopping_lists")
        .update({ items: filtered as any })
        .eq("id", data.id);

      setItems(filtered);
    }
  };

  // Remove a single item, for UI interaction
  const removeItem = async (itemName: string) => {
    await removeItems([itemName]);
  };

  // Replace the whole shopping list when a new one is generated
  const saveList = async (newItems: ShoppingListItem[]) => {
    if (!session?.user.id) return;
    const { data, error } = await supabase
      .from("shopping_lists")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("meal_plan_id", mealPlanId)
      .maybeSingle();

    if (data && data.id) {
      await supabase
        .from("shopping_lists")
        .update({ items: newItems as any, updated_at: new Date().toISOString() })
        .eq("id", data.id);
    } else {
      await supabase
        .from("shopping_lists")
        .insert({
          user_id: session.user.id,
          meal_plan_id: mealPlanId,
          items: newItems as any,
        });
    }
    setItems(newItems);
  };

  // Add items to the shopping list, merging if they already exist
  const addItems = async (itemsToAdd: ShoppingListItem[]) => {
    if (!session?.user.id || itemsToAdd.length === 0) return;

    const newItems = [...items];
    itemsToAdd.forEach(itemToAdd => {
        const existingItem = newItems.find(i => 
            i.item.toLowerCase() === itemToAdd.item.toLowerCase() && 
            i.unit.toLowerCase() === itemToAdd.unit.toLowerCase()
        );

        if (existingItem) {
            existingItem.quantity += itemToAdd.quantity;
        } else {
            newItems.push(itemToAdd);
        }
    });
    await saveList(newItems);
  };

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return { items, isLoading, removeItem, removeItems, saveList, addItems, fetchList, setItems };
}
