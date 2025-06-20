
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingListItem } from "@/data/schema";
import { Session } from "@supabase/supabase-js";

const isValidUUID = (str: string | null | undefined): str is string => {
  if (!str) return false;
  const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return regex.test(str);
};

// Helper function to generate a simple ID for items
const generateItemId = (item: string) => {
  return item.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substr(2, 9);
};

// Helper function to ensure items have IDs
const ensureItemsHaveIds = (items: any[]): ShoppingListItem[] => {
  return items.map(item => ({
    id: item.id || generateItemId(item.item),
    item: item.item,
    quantity: item.quantity,
    unit: item.unit,
    completed: item.completed || false
  }));
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
      setItems(ensureItemsHaveIds(data.items));
    } else {
      setItems([]);
    }
    setIsLoading(false);
  }, [session, mealPlanId]);

  // Remove multiple items from the shopping list
  const removeItems = async (itemNames: string[]) => {
    console.log("🛒 removeItems called with:", itemNames);
    
    if (!session?.user.id || itemNames.length === 0) {
      console.log("❌ Aborting removeItems: no session or empty itemNames");
      return;
    }

    try {
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
        console.error("❌ Error fetching shopping list before removal:", error);
        return;
      }

      if (data && Array.isArray(data.items)) {
        const lowerCaseItemNames = itemNames.map(name => name.toLowerCase());
        const currentItems = ensureItemsHaveIds(data.items);
        const filtered = currentItems.filter((i: ShoppingListItem) => !lowerCaseItemNames.includes(i.item.toLowerCase()));
        
        const updateResult = await supabase
          .from("shopping_lists")
          .update({ items: filtered as any })
          .eq("id", data.id);

        if (updateResult.error) {
          console.error("❌ Database update failed:", updateResult.error);
        } else {
          setItems(filtered);
        }
      }
    } catch (error) {
      console.error("❌ Exception in removeItems:", error);
    }
  };

  // Remove a single item, for UI interaction
  const removeItem = async (itemName: string) => {
    await removeItems([itemName]);
  };

  // Update a single item's quantity and/or unit
  const updateItem = async (itemName: string, quantity?: number, unit?: string) => {
    console.log("🛒 updateItem called with:", { itemName, quantity, unit });
    
    if (!session?.user.id) {
      console.log("❌ Aborting updateItem: no session");
      return;
    }

    try {
      // Get current shopping list
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
        console.error("❌ Error fetching shopping list before update:", error);
        return;
      }

      if (data && Array.isArray(data.items)) {
        const currentItems = ensureItemsHaveIds(data.items);
        const updatedItems = currentItems.map(item => {
          if (item.item.toLowerCase() === itemName.toLowerCase()) {
            return {
              ...item,
              quantity: quantity !== undefined ? quantity : item.quantity,
              unit: unit !== undefined ? unit : item.unit
            };
          }
          return item;
        });
        
        const updateResult = await supabase
          .from("shopping_lists")
          .update({ items: updatedItems as any })
          .eq("id", data.id);

        if (updateResult.error) {
          console.error("❌ Database update failed:", updateResult.error);
        } else {
          setItems(updatedItems);
        }
      }
    } catch (error) {
      console.error("❌ Exception in updateItem:", error);
    }
  };

  // Replace the whole shopping list when a new one is generated
  const saveList = async (newItems: ShoppingListItem[]) => {
    console.log("saveList called with:", newItems);
    
    if (!session?.user.id) {
      console.log("Aborting saveList: no session");
      return;
    }

    const itemsWithIds = ensureItemsHaveIds(newItems);

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
      const updateResult = await supabase
        .from("shopping_lists")
        .update({ items: itemsWithIds as any, updated_at: new Date().toISOString() })
        .eq("id", data.id);
      console.log("Update result:", updateResult);
    } else {
      const insertResult = await supabase
        .from("shopping_lists")
        .insert({
          user_id: session.user.id,
          meal_plan_id: isValidUUID(mealPlanId) ? mealPlanId : null,
          items: itemsWithIds as any,
        });
      console.log("Insert result:", insertResult);
    }
    setItems(itemsWithIds);
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
      return;
    }
    
    const currentItems = ensureItemsHaveIds((currentList?.items as any[]) || []);
    const newItems = [...currentItems];
    const normalize = (name: string) => name.toLowerCase().trim().replace(/es$|s$/, '');

    itemsToAdd.forEach(itemToAdd => {
        const itemWithId = {
          ...itemToAdd,
          id: itemToAdd.id || generateItemId(itemToAdd.item)
        };
        const newItemNameNormalized = normalize(itemWithId.item);
        const existingItemIndex = newItems.findIndex(i => 
            normalize(i.item) === newItemNameNormalized
        );

        if (existingItemIndex > -1) {
            const existingItem = newItems[existingItemIndex];
            // If units are the same, we add quantities. This is a simple "add more" case.
            if (existingItem.unit.toLowerCase() === itemWithId.unit.toLowerCase()) {
                existingItem.quantity += itemWithId.quantity;
            } else {
                // If units are different, we assume it's a correction/update and replace the item.
                newItems[existingItemIndex] = itemWithId;
            }
        } else {
            newItems.push(itemWithId);
        }
    });

    // `saveList` will handle both updating the DB and setting the local state.
    await saveList(newItems);
  };

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return { items, isLoading, removeItem, removeItems, saveList, addItems, fetchList, setItems, updateItem };
}
