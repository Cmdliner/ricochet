// Starts Expo with the address your phone can actually reach.
//
// Expo picks the first network adapter it finds. On a computer with WSL, Hyper-V, Docker or VirtualBox
// those virtual adapters come first, so the QR code points at an address that only exists inside the
// computer, and Expo Go fails with "failed to download remote update".
//
//   pnpm --filter @ricochet/mobile start:lan
//   pnpm --filter @ricochet/mobile start:lan --print     (only shows the address it would use)
//
// Extra arguments are passed to `expo start`. Set REACT_NATIVE_PACKAGER_HOSTNAME yourself to override.

import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";

const VIRTUAL = /vethernet|wsl|hyper-v|virtualbox|vmware|vbox|docker|bluetooth|loopback|tailscale|zerotier|vpn|tap|tun/i;
const WIRELESS = /wi-?fi|wlan|wireless|^en0$/i;

function lanAddress() {
  const candidates = Object.entries(networkInterfaces()).flatMap(([name, list]) =>
    (list ?? []).filter((entry) => entry.family === "IPv4" && !entry.internal).map((entry) => ({ name, address: entry.address })),
  );
  const real = candidates.filter((entry) => !VIRTUAL.test(entry.name));
  return real.find((entry) => WIRELESS.test(entry.name)) ?? real[0] ?? null;
}

const args = process.argv.slice(2);
const chosen = process.env.REACT_NATIVE_PACKAGER_HOSTNAME ? { name: "REACT_NATIVE_PACKAGER_HOSTNAME", address: process.env.REACT_NATIVE_PACKAGER_HOSTNAME } : lanAddress();

if (!chosen) {
  console.error("Could not find a network address your phone could reach. Connect to Wi-Fi, or set REACT_NATIVE_PACKAGER_HOSTNAME.");
  process.exit(1);
}
console.log(`Using ${chosen.address} (${chosen.name}) for the phone to connect to.`);
if (args.includes("--print")) process.exit(0);

const child = spawn("pnpm", ["exec", "expo", "start", "--lan", ...args], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: chosen.address },
});
child.on("exit", (code) => process.exit(code ?? 0));
