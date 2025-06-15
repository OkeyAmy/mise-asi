
import { supabase } from "@/integrations/supabase/client";
import { Content } from "@google/generative-ai";
import { tools } from '@/lib/gemini/tools';

export async function callGeminiProxy(history: Content[]) {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: { 
            contents: history,
            tools: [
              { function_declarations: tools }
            ],
        },
    });

    if (error) {
        throw new Error(`Error calling gemini-proxy: ${error.message}`);
    }

    return data;
}
