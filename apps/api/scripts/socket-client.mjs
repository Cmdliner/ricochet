// A terminal stand-in for the phone: signs in as a throwaway person, opens a socket, prints every event it receives
// and lets you type commands. Run it in two terminals to watch events travel between two people.
//
//   node scripts/socket-client.mjs "Ada"
//   node scripts/socket-client.mjs "Bob" --token garbage      (shows a refused connection)
//
// Commands once running:
//   hub <name>      create a hub (prints its invite code and its pod id)
//   join <CODE>     join a hub by invite code (prints its pod ids)
//   open <podId>    open a pod, so its live messages reach you
//   close           close the pod you have open
//   say <text>      send a message to the open pod
//   typing          tell the open pod you are typing (it expires by itself after 5 seconds)
//   stop            tell the open pod you stopped typing
//   quit
//
// Set API_URL if the API is not on port 3001.

import readline from "node:readline";
import { io } from "socket.io-client";
import { call, devLogin } from "./dev-session.mjs";

const API = process.env.API_URL ?? "http://localhost:3001";
const name = process.argv[2] ?? "Dev User";
const tokenFlag = process.argv.indexOf("--token");
const log = (text) => console.log(`[${name}] ${text}`);

let token;
if (tokenFlag !== -1) {
  token = process.argv[tokenFlag + 1];
  log("using the token you gave");
} else {
  const me = await devLogin(name);
  token = me.accessToken;
  log(`signed in as ${me.userId}`);
}

const socket = io(API, { transports: ["websocket"], auth: { token }, reconnection: false });
let openPod = null;

socket.on("connect", () => log(`connected, socket ${socket.id}`));
socket.on("connect_error", (error) => {
  log(`refused: ${error.message}`);
  process.exit(1);
});
socket.on("disconnect", (reason) => log(`disconnected: ${reason}`));
socket.onAny((event, ...args) => log(`<- ${event} ${JSON.stringify(args)}`));

const ask = (event, payload) =>
  new Promise((resolve) => socket.timeout(5000).emit(event, payload, (error, reply) => resolve(error ? { ok: false, error: "no reply" } : reply)));

const showPods = async (hubId) => {
  const pods = await call(`/hubs/${hubId}/pods`, { method: "GET", token });
  for (const pod of pods) log(`pod #${pod.name}  ${pod.id}`);
};

const commands = {
  async hub(name) {
    const hub = await call("/hubs", { token, body: { name, color: "coral", starterPods: ["general"] } });
    log(`hub "${hub.name}" created, invite code ${hub.inviteCode}`);
    await showPods(hub.id);
  },
  async join(code) {
    const hub = await call("/hubs/join", { token, body: { code } });
    log(`joined "${hub.name}"`);
    await showPods(hub.id);
  },
  async open(podId) {
    const reply = await ask("conversation:open", { conversationId: podId });
    if (reply.ok) openPod = podId;
    log(`open -> ${JSON.stringify(reply)}`);
  },
  async close() {
    if (!openPod) return log("no pod is open");
    log(`close -> ${JSON.stringify(await ask("conversation:close", { conversationId: openPod }))}`);
    openPod = null;
  },
  async say(text) {
    if (!openPod) return log("open a pod first");
    const reply = await ask("message:send", { conversationId: openPod, type: "text", body: text, clientId: crypto.randomUUID() });
    log(`say -> ${JSON.stringify(reply)}`);
  },
  async typing() {
    if (!openPod) return log("open a pod first");
    log(`typing -> ${JSON.stringify(await ask("typing:start", { conversationId: openPod }))}`);
  },
  async stop() {
    if (!openPod) return log("open a pod first");
    log(`stop -> ${JSON.stringify(await ask("typing:stop", { conversationId: openPod }))}`);
  },
  quit() {
    socket.close();
    process.exit(0);
  },
};

const rl = readline.createInterface({ input: process.stdin });
rl.on("line", async (line) => {
  const [command, ...rest] = line.trim().split(" ");
  if (!command) return;
  const handler = commands[command];
  if (!handler) return log(`unknown command "${command}"`);
  try {
    await handler(rest.join(" "));
  } catch (error) {
    log(`error: ${error.message}`);
  }
});
rl.on("close", () => setTimeout(() => process.exit(0), 300));
