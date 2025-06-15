
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export interface InventoryItem {
  id: string;
  user_id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  expiry_date?: string;
  location: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const INVENTORY_CATEGORIES = {
  proteins: "Proteins",
  vegetables: "Vegetables", 
  fruits: "Fruits",
  grains: "Grains & Cereals",
  dairy: "Dairy & Eggs",
  spices: "Spices & Seasonings",
  pantry_staples: "Pantry Staples",
  beverages: "Beverages",
  frozen: "Frozen Items",
  canned: "Canned Goods",
  other: "Other"
} as const;

export function useInventory(session: Session | null) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (!session?.user.id) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from("user_inventory")
      .select("*")
      .eq("user_id", session.user.id)
      .order("category", { ascending: true })
      .order("item_name", { ascending: true });

    if (data) {
      setItems(data);
    }
    if (error) {
      console.error("Error fetching inventory:", error);
    }
    setIsLoading(false);
  }, [session]);

  const addItem = async (item: Omit<InventoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!session?.user.id) return;

    const { data, error } = await supabase
      .from("user_inventory")
      .insert({
        ...item,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (data && !error) {
      setItems(prev => [...prev, data]);
    }
    return { data, error };
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    if (!session?.user.id) return;

    const { data, error } = await supabase
      .from("user_inventory")
      .update(updates)
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (data && !error) {
      setItems(prev => prev.map(item => item.id === id ? data : item));
    }
    return { data, error };
  };

  const deleteItem = async (id: string) => {
    if (!session?.user.id) return;

    const { error } = await supabase
      .from("user_inventory")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (!error) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
    return { error };
  };

  const getItemsByCategory = (category: string) => {
    return items.filter(item => item.category === category);
  };

  const searchItems = (query: string) => {
    return items.filter(item => 
      item.item_name.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    );
  };

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return {
    items,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    getItemsByCategory,
    searchItems,
    fetchInventory,
    categories: INVENTORY_CATEGORIES
  };
}
