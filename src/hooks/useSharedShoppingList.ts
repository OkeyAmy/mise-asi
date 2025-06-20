
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingListItem } from "@/data/schema";
import { Session } from "@supabase/supabase-js";

export function useSharedShoppingList(session: Session | null) {
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Generate a random share token
  const generateShareToken = () => {
    return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  };

  // Create a shareable link for shopping list items
  const createShareableLink = useCallback(async (items: ShoppingListItem[], title?: string) => {
    if (!session?.user.id || items.length === 0) {
      throw new Error("No items to share or user not authenticated");
    }

    setIsCreating(true);
    try {
      const shareToken = generateShareToken();
      
      const { data, error } = await supabase
        .from("shared_shopping_lists")
        .insert({
          share_token: shareToken,
          shared_by_user_id: session.user.id,
          items: items as any,
          title: title || "Shared Shopping List"
        })
        .select()
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/shared/${shareToken}`;
      return { shareUrl, shareToken };
    } finally {
      setIsCreating(false);
    }
  }, [session]);

  // Get shared shopping list by token
  const getSharedList = useCallback(async (shareToken: string) => {
    const { data, error } = await supabase
      .from("shared_shopping_lists")
      .select("*")
      .eq("share_token", shareToken)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error) throw error;
    return data;
  }, []);

  // Import shared items to user's shopping list
  const importSharedItems = useCallback(async (shareToken: string, onAddItems: (items: ShoppingListItem[]) => Promise<void>) => {
    if (!session?.user.id) {
      throw new Error("User not authenticated");
    }

    setIsImporting(true);
    try {
      const sharedList = await getSharedList(shareToken);
      const items = sharedList.items as unknown as ShoppingListItem[];
      
      if (items && items.length > 0) {
        await onAddItems(items);
        return { items, title: sharedList.title };
      }
      
      throw new Error("No items found in shared list");
    } finally {
      setIsImporting(false);
    }
  }, [session, getSharedList]);

  return {
    createShareableLink,
    getSharedList,
    importSharedItems,
    isCreating,
    isImporting
  };
}
