
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not found in environment variables");
      return new Response(JSON.stringify({ 
        error: { 
          message: "GEMINI_API_KEY not configured in Supabase secrets",
          code: "API_KEY_MISSING"
        } 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`;

    // Prepare the request payload for Gemini API
    const geminiPayload: any = {
      contents: body.contents,
      tools: body.tools
    };

    // Add system instruction if provided
    if (body.systemInstruction) {
      geminiPayload.systemInstruction = body.systemInstruction;
    }

    // Log the payload being sent to Gemini for debugging (without sensitive data)
    console.log("Calling Gemini API with model: gemini-2.5-pro");
    console.log("Contents length:", body.contents?.length || 0);
    console.log("Tools provided:", !!body.tools);

    const geminiRes = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geminiPayload),
    });

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error("Gemini API error:", geminiData);
      return new Response(JSON.stringify(geminiData), {
        status: geminiRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(geminiData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Gemini proxy error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
