// Signs in a brand new throwaway user against your local API and prints their tokens as JSON.
// It reads the sign-in code from Mailpit (the local mail catcher), exactly like a person would.
//
//   node scripts/dev-login.mjs "Ada Lovelace"
//
// Then use the token with curl:
//   curl -H "Authorization: Bearer <accessToken>" http://localhost:3001/hubs
//
// Set API_URL if the API is not on port 3001. Mailpit must be running (pnpm infra:up).

const API = process.env.API_URL ?? "http://localhost:3001";
const MAIL = process.env.MAIL_URL ?? "http://localhost:8025/api/v1";
const displayName = process.argv[2] ?? "Dev User";

async function call(path, { method = "POST", body, token } = {}) {
  const response = await fetch(API + path, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${method} ${path} failed (${response.status}): ${JSON.stringify(json)}`);
  return json;
}

const email = `dev.${Date.now()}.${Math.floor(Math.random() * 1000)}@example.com`;
await call("/auth/request-code", { body: { email } });

// The code arrives by email a moment later. Look for it in Mailpit.
let code;
for (let attempt = 0; attempt < 20 && !code; attempt++) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const { messages } = await (await fetch(`${MAIL}/messages`)).json();
  const mail = messages.find((m) => m.To.some((to) => to.Address === email));
  if (!mail) continue;
  const full = await (await fetch(`${MAIL}/message/${mail.ID}`)).json();
  code = /\b(\d{6})\b/.exec(full.Text)?.[1];
}
if (!code) throw new Error("No sign-in code arrived. Is Mailpit running?");

const session = await call("/auth/verify", { body: { email, code } });
const handle = `${displayName.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 10)}_${String(Date.now()).slice(-6)}`;
await call("/me", { method: "PATCH", token: session.accessToken, body: { displayName, handle } });

console.log(JSON.stringify({ userId: session.user.id, displayName, handle, accessToken: session.accessToken, refreshToken: session.refreshToken }, null, 2));
