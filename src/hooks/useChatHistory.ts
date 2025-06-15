
import { useState, useCallback } from "react";
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
      // The table 'chat_sessions' is not in the generated types, so we cast to any to bypass TS checks.
      // A migration is needed to create this table in the database for this feature to work.
      const { error } = await (supabase as any)
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
      const { data, error } = await (supabase as any)
        .from("chat_sessions")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error("Error loading chat session:", error);
        return null;
      }
      
      if (data) {
        // Since we are using 'as any', we need to cast the data to our ChatSession interface.
        const chatSessionData = data as ChatSession;
        return {
          messages: chatSessionData.messages || [],
          thoughtSteps: chatSessionData.thought_steps || []
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
      const { error } = await (supabase as any)
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
