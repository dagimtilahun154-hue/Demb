const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const groqKey = Deno.env.get('GROQ_API_KEY');
    if (!groqKey) {
      return new Response(JSON.stringify({ error: 'GROQ_API_KEY is not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('GROQ_MODEL') ?? 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content:
              'You are Demb support chat. Be warm, brief, non-clinical, and action-oriented. Return only JSON with reply and optional suggestedAction.',
          },
          {
            role: 'user',
            content: `Context and latest message:\n${JSON.stringify(body, null, 2)}\n\nReturn JSON: {"reply":"short supportive response","suggestedAction":"start_focus|start_recovery_task|delay_app|update_intention|ask_buddy|mood_checkin"}`,
          },
        ],
        temperature: 0.45,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return new Response(JSON.stringify({ error: text }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content ?? '{}';
    return new Response(content, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error?.message ?? error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
