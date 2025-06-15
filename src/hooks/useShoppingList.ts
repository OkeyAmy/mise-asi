
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingListItem } from "@/data/schema";
import { Session } from "@supabase/supabase-js";

const isValidUUID = (str: string | null | undefined): str is string => {
  if (!str) return false;
  const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return regex.test(str);
};

export function useShoppingList(session: Session | null, mealPlanId: string) {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the user's shopping list
  const fetchList = useCallback(async () => {
    if (!session?.user.id) return;

    setIsLoading(true);

    let query = supabase
      .from("shopping_lists")
      .select("items, id")
      .eq("user_id", session.user.id);
    
    if (isValidUUID(mealPlanId)) {
      query = query.eq("meal_plan_id", mealPlanId);
    } else {
      query = query.is("meal_plan_id", null);
    }
    
    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Error fetching shopping list:", error);
    }

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

    let query = supabase
      .from("shopping_lists")
      .select("id, items")
      .eq("user_id", session.user.id);
      
    if (isValidUUID(mealPlanId)) {
      query = query.eq("meal_plan_id", mealPlanId);
    } else {
      query = query.is("meal_plan_id", null);
    }
    
    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Error preparing to remove items from shopping list:", error);
      return;
    }

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

    let query = supabase
      .from("shopping_lists")
      .select("id")
      .eq("user_id", session.user.id);

    if (isValidUUID(mealPlanId)) {
      query = query.eq("meal_plan_id", mealPlanId);
    } else {
      query = query.is("meal_plan_id", null);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Error saving shopping list (select phase):", error);
      return;
    }

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
          meal_plan_id: isValidUUID(mealPlanId) ? mealPlanId : null,
          items: newItems as any,
        });
    }
    setItems(newItems);
  };

  // Add items to the shopping list, merging if they already exist
  const addItems = async (itemsToAdd: ShoppingListItem[]) => {
    if (!session?.user.id || itemsToAdd.length === 0) return;

    // First, fetch the most up-to-date list from the database to avoid stale state issues.
    let query = supabase
      .from("shopping_lists")
      .select("id, items")
      .eq("user_id", session.user.id);

    if (isValidUUID(mealPlanId)) {
      query = query.eq("meal_plan_id", mealPlanId);
    } else {
      query = query.is("meal_plan_id", null);
    }
    
    const { data: currentList, error: fetchError } = await query.maybeSingle();

    if (fetchError) {
      console.error("Error fetching shopping list before adding items:", fetchError);
      // Optionally, you could show a toast to the user here.
      return;
    }
    
    const currentItems = (currentList?.items as unknown as ShoppingListItem[]) || [];
    const newItems = [...currentItems];

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

    // `saveList` will handle both updating the DB and setting the local state.
    await saveList(newItems);
  };

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return { items, isLoading, removeItem, removeItems, saveList, addItems, fetchList, setItems };
}
