
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { contents, systemInstruction } = body;

    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY not configured");
    }

    // Convert Gemini format to OpenAI format for Groq
    const messages = contents.map((content: any) => {
      if (content.role === "model") {
        return {
          role: "assistant",
          content: content.parts.map((part: any) => part.text || "").join(""),
        };
      } else {
        return {
          role: content.role,
          content: content.parts.map((part: any) => part.text || "").join(""),
        };
      }
    });

    // Add system instruction
    if (systemInstruction) {
      messages.unshift({
        role: "system",
        content: systemInstruction,
      });
    }

    console.log("Calling Groq API with messages:", JSON.stringify(messages, null, 2));

    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-r1-distill-llama-70b",
        messages,
        temperature: 0.6,
        max_tokens: 4096,
        top_p: 0.95,
      }),
    });

    const groqData = await groqRes.json();

    if (!groqRes.ok) {
      console.error("Groq API error:", groqData);
      return new Response(JSON.stringify(groqData), {
        status: groqRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert OpenAI response back to Gemini format
    const choice = groqData.choices[0];
    const geminiFormatResponse = {
      candidates: [{
        content: {
          parts: [{ text: choice.message.content }]
        }
      }]
    };

    return new Response(JSON.stringify(geminiFormatResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Groq proxy error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
