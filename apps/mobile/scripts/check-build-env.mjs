// Runs on the EAS build server before anything is installed (the "eas-build-pre-install" hook in package.json).
// A release build has no dev server to find the API, so without a real address the app would install fine and then
// fail to sign in for everyone. Better to stop the build here.
const profile = process.env.EAS_BUILD_PROFILE;
if (!profile || profile === "development") process.exit(0);

const url = process.env.EXPO_PUBLIC_API_URL ?? "";
const problem = !url
  ? "EXPO_PUBLIC_API_URL is not set."
  : url.includes("REPLACE")
    ? "EXPO_PUBLIC_API_URL is still the placeholder in eas.json."
    : !url.startsWith("https://")
      ? "EXPO_PUBLIC_API_URL must start with https://. Android refuses plain http in release builds, and tokens must not travel unencrypted."
      : null;

if (problem) {
  console.error(`\nCannot build the "${profile}" profile: ${problem}\nSet the address of your deployed API in apps/mobile/eas.json, then build again.\n`);
  process.exit(1);
}
console.log(`Building "${profile}" against ${url}`);
