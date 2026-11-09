// Supabase Edge Function: check-url
// Checks a URL against Google Web Risk API
// Keeps the API key server-side, away from frontend code

const GOOGLE_WEB_RISK_KEY = Deno.env.get('GOOGLE_WEB_RISK_API_KEY') ?? '';

const THREAT_TYPES = ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'];

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { url } = await req.json() as { url: string };

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing url' }), { status: 400 });
    }

    // Basic validation
    try { new URL(url); } catch {
      return new Response(JSON.stringify({ safe: false, threats: ['INVALID_URL'] }), { status: 200 });
    }

    // If no API key configured, return unchecked
    if (!GOOGLE_WEB_RISK_KEY) {
      return new Response(
        JSON.stringify({ safe: null, message: 'Web Risk API key not configured' }),
        {
          status: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        }
      );
    }

    // Call Google Web Risk Lookup API
    const params = new URLSearchParams({
      uri: url,
      key: GOOGLE_WEB_RISK_KEY,
      ...Object.fromEntries(THREAT_TYPES.map((t, i) => [`threatTypes[${i}]`, t])),
    });

    const webRiskRes = await fetch(
      `https://webrisk.googleapis.com/v1/uris:search?${params.toString()}`
    );

    if (!webRiskRes.ok) {
      throw new Error(`Web Risk API error: ${webRiskRes.status}`);
    }

    const data = await webRiskRes.json() as {
      threat?: { threatTypes: string[]; expireTime: string };
    };

    const safe = !data.threat;
    const threats = data.threat?.threatTypes ?? [];

    return new Response(
      JSON.stringify({ safe, threats }),
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('check-url error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error', safe: null }),
      {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      }
    );
  }
});
