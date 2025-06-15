
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { UserPreferences } from "@/data/schema";
import { toast } from "sonner";

const defaultPreferences: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  restrictions: [],
  goals: [],
  habits: [],
  inventory: [],
  meal_ratings: {},
  swap_preferences: {
    swap_frequency: "medium",
    preferred_cuisines: [],
    disliked_ingredients: [],
  },
};

export function usePreferences(session: Session | null) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!session?.user.id) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      toast.error("Could not fetch user preferences.");
      console.error(error);
    } else if (data) {
      setPreferences(data);
    } else {
      // No preferences found, create initial ones
      const { data: newData, error: newError } = await supabase
        .from("user_preferences")
        .insert({ ...defaultPreferences, user_id: session.user.id })
        .select()
        .single();
      if (newError) {
        toast.error("Could not create initial user preferences.");
        console.error(newError);
      } else if (newData) {
        setPreferences(newData);
      }
    }
    setIsLoading(false);
  }, [session]);

  const updatePreferences = async (updates: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!session?.user.id || !preferences) {
        toast.error("You must be logged in to update preferences.");
        return;
    };
    const { data, error } = await supabase
      .from("user_preferences")
      .update(updates)
      .eq("id", preferences.id)
      .select()
      .single();
    
    if (error) {
      toast.error("Failed to update preferences.");
    } else if (data) {
      setPreferences(data);
      toast.success("Preferences updated!");
    }
    return { data, error };
  };
  
  useEffect(() => {
    if (session) {
        fetchPreferences();
    }
  }, [session, fetchPreferences]);

  return { preferences, isLoading, fetchPreferences, updatePreferences };
}
