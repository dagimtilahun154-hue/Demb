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
    const prompt = `
You are Demb's digital wellness planner.
Return ONLY valid JSON. No markdown.

Create a practical 48-hour recovery plan from this user data:
${JSON.stringify(body, null, 2)}

JSON shape:
{
  "explanation": "two short supportive sentences",
  "primaryCauses": ["excessive social media"],
  "digitalRules": [
    {"appCategory":"social_media","appName":"Social Apps","allowedMinutes":40,"windowMinutes":120,"recoveryRequiredAfterLimit":true}
  ],
  "recoveryTasks": [
    {"type":"walking","title":"Short title","target":"specific action","durationMinutes":10,"verification":"pedometer","rewardPoints":25,"recoveryValue":25}
  ],
  "schedule": [
    {"label":"Evening wind-down","timeWindow":"20:00 - 21:00","taskId":"task_1"}
  ],
  "buddyActions": ["short buddy action"],
  "lockScreenMessage": "short message shown on blocked-app screen",
  "supportPrompts": ["short chat prompt"],
  "dailyCheckInTime": "20:00",
  "emotionalSupportTone": "calm, brief, practical",
  "aiActions": ["start_focus","start_recovery_task","delay_app","mood_checkin"]
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('GROQ_MODEL') ?? 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You produce safe digital-wellness recovery plans as strict JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.35,
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
    return new Response(JSON.stringify({ plan: JSON.parse(content) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error?.message ?? error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
