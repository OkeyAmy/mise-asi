
import { supabase } from "@/integrations/supabase/client";
import { Content } from "@google/generative-ai";
import { tools } from '@/lib/gemini/tools';
import { getSystemPrompt } from '@/lib/prompts/systemPrompt';

export async function callGeminiProxy(history: Content[]) {
    try {
        // The Gemini REST API expects snake_case for its keys (e.g., "function_declarations"),
        // but the tools object from our library uses camelCase ("functionDeclarations").
        // We need to transform it before sending it to the proxy function.
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
                systemInstruction: {
                    parts: [{ text: getSystemPrompt() }]
                }
            },
        });

        if (error) {
            throw new Error(`Error calling gemini-proxy: ${error.message}`);
        }

        return data;
    } catch (error) {
        console.error("Gemini proxy failed, attempting Groq fallback via edge function:", error);
        
        // Fallback to Groq via edge function
        try {
            const { data: groqData, error: groqError } = await supabase.functions.invoke('groq-proxy', {
                body: { 
                    contents: history,
                    systemInstruction: getSystemPrompt()
                },
            });

            if (groqError) {
                throw new Error(`Groq fallback also failed: ${groqError.message}`);
            }

            return groqData;
        } catch (groqFallbackError) {
            console.error("Both Gemini and Groq proxies failed:", groqFallbackError);
            throw error; // Throw original Gemini error
        }
    }
}
