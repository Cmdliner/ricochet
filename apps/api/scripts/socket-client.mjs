// A terminal stand-in for the phone: signs in as a throwaway person, opens a socket and prints every event it receives.
// Run it in two terminals to watch events travel between two people.
//
//   node scripts/socket-client.mjs "Ada"
//   node scripts/socket-client.mjs "Bob" --token garbage      (shows a refused connection)
//
// Set API_URL if the API is not on port 3001.

import { io } from "socket.io-client";
import { devLogin } from "./dev-session.mjs";

const API = process.env.API_URL ?? "http://localhost:3001";
const name = process.argv[2] ?? "Dev User";
const tokenFlag = process.argv.indexOf("--token");

let token;
if (tokenFlag !== -1) {
  token = process.argv[tokenFlag + 1];
  console.log(`[${name}] using the token you gave`);
} else {
  const me = await devLogin(name);
  token = me.accessToken;
  console.log(`[${name}] signed in as ${me.userId}`);
}

const socket = io(API, { transports: ["websocket"], auth: { token }, reconnection: false });

socket.on("connect", () => console.log(`[${name}] connected, socket ${socket.id}`));
socket.on("connect_error", (error) => {
  console.log(`[${name}] refused: ${error.message}`);
  process.exit(1);
});
socket.on("disconnect", (reason) => console.log(`[${name}] disconnected: ${reason}`));
socket.onAny((event, ...args) => console.log(`[${name}] <- ${event}`, JSON.stringify(args)));
