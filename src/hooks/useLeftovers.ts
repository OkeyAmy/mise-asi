
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LeftoverItem } from '@/data/schema';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

export const useLeftovers = (session: Session | null) => {
    const [items, setItems] = useState<LeftoverItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLeftovers = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_leftovers')
                .select('*')
                .order('date_created', { ascending: false });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to fetch leftovers.');
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    useEffect(() => {
        fetchLeftovers();
    }, [fetchLeftovers]);
    
    useEffect(() => {
        if (!session) return;

        const channel = supabase
            .channel('user-leftovers-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'user_leftovers', filter: `user_id=eq.${session.user.id}` },
                () => {
                    fetchLeftovers();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session, fetchLeftovers]);

    const addLeftover = async (newItem: Omit<LeftoverItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'date_created'> & { date_created?: string }) => {
        if (!session) return;
        try {
            const { data, error } = await supabase
                .from('user_leftovers')
                .insert([{ ...newItem, user_id: session.user.id }])
                .select();
            
            if (error) throw error;
            if (data) {
                toast.success(`'${data[0].meal_name}' added to leftovers.`);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to add leftover.');
        }
    };

    const updateLeftover = async (id: string, updates: Partial<{ servings: number; notes: string }>) => {
        if (!session) return;
        try {
            const { error } = await supabase
                .from('user_leftovers')
                .update(updates)
                .eq('id', id);
            
            if (error) throw error;
            toast.success('Leftover updated.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update leftover.');
        }
    };
    
    const removeLeftover = async (id: string) => {
        if (!session) return;
        try {
            const { error } = await supabase
                .from('user_leftovers')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            toast.success('Leftover removed.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to remove leftover.');
        }
    };

    return { items, isLoading, addLeftover, updateLeftover, removeLeftover, getLeftovers: fetchLeftovers };
};
