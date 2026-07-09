# KiloTrack Groq proxy — deploy in ~5 minutes

This tiny Cloudflare Worker holds **one** Groq API key server-side so that
**no user is ever asked for a key**. The app sends the food photo to the
Worker; the Worker adds the secret key and calls Groq.

## Steps (Cloudflare dashboard — no terminal needed)

1. Get a free Groq key: https://console.groq.com/keys  (starts with `gsk_`)
2. Go to https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker**.
3. Name it e.g. `kilotrack-groq` → **Deploy** (the default hello-world is fine for now).
4. Click **Edit code**, delete everything, paste the contents of `worker.js`, then **Deploy**.
5. Go to the Worker’s **Settings → Variables and Secrets** → **Add**:
   - Name: `GROQ_KEY`
   - Value: your `gsk_...` key
   - Type: **Secret (encrypt)** → **Save and deploy**
6. Copy the Worker URL — it looks like `https://kilotrack-groq.<your-subdomain>.workers.dev`
7. Send Riyan that URL. He’ll paste it into `app.js` (`GROQ_PROXY_URL`) and the
   key prompt disappears for everyone, forever.

## Notes
- The key stays inside Cloudflare — it is never in the public repo or the browser.
- Only `riyanmujtaba.github.io` (and localhost) may call the Worker, so nobody
  else can burn your Groq quota.
