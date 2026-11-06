// Prints the tokens of a brand new throwaway user as JSON.
//
//   node scripts/dev-login.mjs "Ada Lovelace"
//
// Then use the token with curl:
//   curl -H "Authorization: Bearer <accessToken>" http://localhost:3001/hubs
//
// Set API_URL if the API is not on port 3001.

import { devLogin } from "./dev-session.mjs";

console.log(JSON.stringify(await devLogin(process.argv[2] ?? "Dev User"), null, 2));
