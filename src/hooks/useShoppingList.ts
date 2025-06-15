
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

    if (data) {
      setItems(data.items || []);
    } else {
      setItems([]);
    }
    setIsLoading(false);
  }, [session, mealPlanId]);

  // Remove item from the shopping list in Supabase and update UI
  const removeItem = async (itemName: string) => {
    if (!session?.user.id) return;
    const { data, error } = await supabase
      .from("shopping_lists")
      .select("id, items")
      .eq("user_id", session.user.id)
      .eq("meal_plan_id", mealPlanId)
      .maybeSingle();

    if (data) {
      const filtered = (data.items || []).filter((i: ShoppingListItem) => i.item !== itemName);
      await supabase
        .from("shopping_lists")
        .update({ items: filtered })
        .eq("id", data.id);

      setItems(filtered);
    }
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
        .update({ items: newItems, updated_at: new Date().toISOString() })
        .eq("id", data.id);
    } else {
      await supabase
        .from("shopping_lists")
        .insert({
          user_id: session.user.id,
          meal_plan_id: mealPlanId,
          items: newItems,
        });
    }
    setItems(newItems);
  };

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return { items, isLoading, removeItem, saveList, fetchList, setItems };
}
