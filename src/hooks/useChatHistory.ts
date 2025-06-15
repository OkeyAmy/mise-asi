import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, ThoughtStep } from '@/data/schema';
import { Json } from '@/integrations/supabase/types';

interface UseChatHistoryProps {
  userId?: string;
  initialMessages?: Message[];
  initialThoughtSteps?: ThoughtStep[];
}

export const useChatHistory = ({ userId, initialMessages = [], initialThoughtSteps = [] }: UseChatHistoryProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>(initialThoughtSteps);

  const saveChatHistory = useCallback(async (currentMessages: Message[], currentThoughtSteps: ThoughtStep[]) => {
    if (!userId) return;
    const { error } = await supabase.from('chat_sessions').upsert(
      [{
        user_id: userId,
        messages: currentMessages as unknown as Json,
        thought_steps: currentThoughtSteps as unknown as Json,
      }],
      { onConflict: 'user_id' }
    );
    if (error) {
      console.error('Error saving chat history:', error);
    }
  }, [userId]);
  
  const resetChatHistory = useCallback(async () => {
    setMessages([]);
    setThoughtSteps([]);
    if (!userId) return;
    await supabase.from('chat_sessions').delete().eq('user_id', userId);
  }, [userId]);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from('chat_sessions')
          .select('*')
          .single();

        if (data) {
          setMessages((data.messages as unknown as Message[]) || []);
          setThoughtSteps((data.thought_steps as unknown as ThoughtStep[]) || []);
        } else if (error && error.code !== 'PGRST116') { // Ignore 'no rows found'
          console.error('Error fetching chat history:', error);
        }
      } catch (e) {
        console.error('Error fetching chat history:', e);
      }
    };
    fetchChatHistory();
  }, [userId]);
  
  return { messages, setMessages, thoughtSteps, setThoughtSteps, saveChatHistory, resetChatHistory };
};
