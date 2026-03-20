import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const apiKeyHeader = req.headers.get("apikey");
    console.log("Authorization header present:", !!authHeader);
    console.log("apikey header present:", !!apiKeyHeader);
    
    if (!authHeader && !apiKeyHeader) {
      console.error("Missing both Authorization and apikey headers");
    }

    const { messages, systemPrompt, model, global_api_key_id } = await req.json();

    if (!global_api_key_id) {
      throw new Error("No API key selected! Please choose an API key from the sidebar.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: keyData, error: keyError } = await supabase
      .from("user_api_keys")
      .select("api_key, provider")
      .eq("id", global_api_key_id)
      .single();

    if (keyError || !keyData) {
      throw new Error("Failed to retrieve configured API key from database.");
    }

    const { api_key, provider } = keyData;

    let apiUrl = "";
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    let body: any = {};

    const formattedMessages = [
      { role: "system", content: systemPrompt || "You are a helpful AI assistant." },
      ...messages,
    ];

    if (provider === "openai") {
      apiUrl = "https://api.openai.com/v1/chat/completions";
      headers["Authorization"] = `Bearer ${api_key}`;
      body = {
        model: model || "gpt-4o",
        messages: formattedMessages,
        stream: true,
      };
    } else if (provider === "anthropic") {
      apiUrl = "https://api.anthropic.com/v1/messages";
      headers["x-api-key"] = api_key;
      headers["anthropic-version"] = "2023-06-01";
      // Anthropic does not support 'system' role in messages list, it's a top level param
      const anthropicMsg = messages.map((m: any) => ({ role: m.role, content: m.content }));
      body = {
        model: model || "claude-3-5-sonnet-20240620",
        system: systemPrompt || "You are a helpful AI assistant.",
        messages: anthropicMsg,
        max_tokens: 4096,
        stream: true,
      };
    } else if (provider === "gemini") {
      const geminiModel = model || "gemini-1.5-pro";
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?key=${api_key}&alt=sse`;
      // Convert OpenAI format to Gemini format
      const geminiMessages = formattedMessages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));
      body = {
        contents: geminiMessages,
      };
    } else if (provider === "openrouter") {
      apiUrl = "https://openrouter.ai/api/v1/chat/completions";
      headers["Authorization"] = `Bearer ${api_key}`;
      body = {
        model: model || "meta-llama/llama-3-70b-instruct",
        messages: formattedMessages,
        stream: true,
      };
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error(`${provider} API error:`, response.status, t);
      // Try to parse AI provider error
      let errorMessage = "AI API error";
      try {
          const parsed = JSON.parse(t);
          errorMessage = parsed.error?.message || parsed.error || errorMessage;
      } catch (e) {}
      
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("agent-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
