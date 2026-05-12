// Symptom analysis edge function - uses Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symptoms, age, gender, duration, severity } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a medical AI assistant. Analyze the user's symptoms and provide structured health insights. Always include a disclaimer to consult a real doctor. Never diagnose definitively. IMPORTANT: Respond in ENGLISH ONLY. All field values (condition names, explanations, precautions, specialist, medicine names/purposes, advice) MUST be in English regardless of the language used in the input symptoms. For the 'specialist' field, return a single concise specialty name (e.g. "Dentist", "Cardiologist", "General Physician", "Dermatologist") — do not return a sentence.`;
    const userPrompt = `Patient: ${age}yo ${gender}. Symptoms: ${symptoms}. Duration: ${duration}. Severity: ${severity}.\n\nProvide health insights via the analyze_symptoms tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_symptoms",
            description: "Return structured analysis of patient symptoms",
            parameters: {
              type: "object",
              properties: {
                conditions: {
                  type: "array",
                  description: "List of possible conditions, most likely first",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      likelihood: { type: "string", enum: ["low", "moderate", "high"] },
                      explanation: { type: "string" },
                    },
                    required: ["name", "likelihood", "explanation"],
                  },
                },
                precautions: { type: "array", items: { type: "string" } },
                specialist: { type: "string", description: "Suggested medical specialist" },
                medicines: {
                  type: "array",
                  description: "General OTC medicine suggestions (informational only)",
                  items: {
                    type: "object",
                    properties: { name: { type: "string" }, purpose: { type: "string" } },
                    required: ["name", "purpose"],
                  },
                },
                advice: { type: "string", description: "General health advice and when to seek emergency help" },
              },
              required: ["conditions", "precautions", "specialist", "medicines", "advice"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_symptoms" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI error", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("symptom-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
