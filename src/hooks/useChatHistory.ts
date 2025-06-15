
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { ThoughtStep } from "@/data/schema";

interface ChatMessage {
  id: number;
  text: string;
  sender: "user" | "bot";
}

interface ChatSession {
  id: string;
  user_id: string;
  messages: ChatMessage[];
  thought_steps: ThoughtStep[];
  created_at: string;
  updated_at: string;
}

export function useChatHistory(session: Session | null) {
  const [isLoading, setIsLoading] = useState(false);

  const saveChatSession = useCallback(async (messages: ChatMessage[], thoughtSteps: ThoughtStep[]) => {
    if (!session?.user.id) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("chat_sessions")
        .upsert({
          user_id: session.user.id,
          messages,
          thought_steps: thoughtSteps,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) {
        console.error("Error saving chat session:", error);
      }
    } catch (error) {
      console.error("Error saving chat session:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const loadChatSession = useCallback(async (): Promise<{ messages: ChatMessage[], thoughtSteps: ThoughtStep[] } | null> => {
    if (!session?.user.id) return null;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error("Error loading chat session:", error);
        return null;
      }
      
      if (data) {
        return {
          messages: data.messages || [],
          thoughtSteps: data.thought_steps || []
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error loading chat session:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const clearChatSession = useCallback(async () => {
    if (!session?.user.id) return;
    
    try {
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("user_id", session.user.id);
      
      if (error) {
        console.error("Error clearing chat session:", error);
      }
    } catch (error) {
      console.error("Error clearing chat session:", error);
    }
  }, [session]);

  return {
    saveChatSession,
    loadChatSession,
    clearChatSession,
    isLoading
  };
}
