// ════════════════════════════════════════════════════════════════════
//  KiloTrack — Groq vision proxy (Cloudflare Worker)
//  Holds ONE Groq key server-side so no user is ever asked for a key.
//  The browser posts the chat payload here; the Worker adds the secret
//  Authorization header and forwards it to Groq.
//
//  Deploy: Cloudflare dashboard → Workers → Create → paste this file.
//  Then add a Variable/Secret named  GROQ_KEY  = your gsk_... key.
// ════════════════════════════════════════════════════════════════════

// Only these origins may use the proxy (stops randoms using your key).
const ALLOWED_ORIGINS = [
  'https://riyanmujtaba.github.io',
  'http://localhost:8765',
  'http://127.0.0.1:8765'
];

const ALLOWED_MODELS = [
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct'
];

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allowed = ALLOWED_ORIGINS.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    };

    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST')
      return json({ error: { message: 'Method not allowed' } }, 405, cors);
    if (!allowed)
      return json({ error: { message: 'Origin not allowed' } }, 403, cors);
    if (!env.GROQ_KEY)
      return json({ error: { message: 'Server missing GROQ_KEY' } }, 500, cors);

    let body;
    try { body = await req.json(); }
    catch { return json({ error: { message: 'Bad JSON' } }, 400, cors); }

    const model = ALLOWED_MODELS.includes(body.model) ? body.model : ALLOWED_MODELS[0];
    const payload = {
      model,
      messages: body.messages,
      temperature: typeof body.temperature === 'number' ? body.temperature : 0.15,
      max_tokens: Math.min(body.max_tokens || 2000, 2000)
    };

    const gr = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await gr.text();
    return new Response(text, {
      status: gr.status,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}
