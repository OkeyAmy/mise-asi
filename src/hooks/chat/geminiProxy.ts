
import { supabase } from "@/integrations/supabase/client";
import { Content } from "@google/generative-ai";
import { tools } from '@/lib/gemini/tools';

export async function callGeminiProxy(history: Content[]) {
    // The Gemini REST API expects snake_case for its keys (e.g., "function_declarations"),
    // but the tools object from our library uses camelCase ("functionDeclarations").
    // We need to transform it before sending it to the proxy function.
    // I am assuming `tools` is an array of objects, each with a `functionDeclarations` property.
    const toolsForProxy = (tools as any[])?.map(tool => {
        if (tool.functionDeclarations) {
            return { function_declarations: tool.functionDeclarations };
        }
        return tool;
    });

    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: { 
            contents: history,
            tools: toolsForProxy,
        },
    });

    if (error) {
        throw new Error(`Error calling gemini-proxy: ${error.message}`);
    }

    return data;
}
