# Releasing the Android app

This covers getting an Android build of Ricochet to people, first as a file you send around, later through Google Play.
Nothing here needs a company. Everything marked **free** costs nothing.

## The idea in one minute

A phone app is a file. On Android that file is an **APK** (install it directly) or an **AAB** (what Google Play wants).
Building one needs a signing key, which proves later versions come from you. We let **EAS**, Expo's build service,
build the file in the cloud and keep the signing key. The free plan has a limited number of builds a month.

Two things must be true before a build is useful:

1. **The API is online at an https address.** The app on someone's phone cannot reach your laptop. Android also refuses
   plain `http://` in release builds, so the server needs a certificate (for example Caddy, or an AWS load balancer with a
   free AWS certificate, on a subdomain you own such as `api.<your domain>`).
2. **The app knows that address.** Put it in `apps/mobile/eas.json` (`EXPO_PUBLIC_API_URL`, in both profiles). The build
   refuses to start while it is still the placeholder, so you cannot ship an app that points at nothing.

## The package ID is permanent

`me.adeyemiabiade.ricochet` (set in `apps/mobile/app.json`) is the app's identity on Android. Once an app with that ID is
on Google Play it can never change. If you would rather use another ID, change it **before** the first Play upload.

## Step 1. Make a free Expo account and link the project (once)

```bash
cd apps/mobile
npx eas-cli login          # create the free account at expo.dev first
npx eas-cli init           # adds a project id to app.json. Commit that change.
```

The project id also switches on push notification registration (`apps/mobile/src/lib/push.ts` skips it without one).

## Step 2. Build an APK to share

```bash
pnpm --filter @ricochet/mobile build:android
```

When it finishes, EAS prints a link to the APK. Download it and send it to people (WhatsApp, a download link, a GitHub
release). Each new build gets a higher version code automatically, so people can install a newer APK over an older one.

What people will see when installing:

- Android asks them to allow "install unknown apps" for the app they opened the file from (Chrome, WhatsApp, Files).
- Google Play Protect may say the app is "not commonly downloaded". That is normal for any app outside the store.

## Step 3. Back up the signing key

The first build creates the key and EAS stores it. Download a copy now and keep it somewhere safe and private:

```bash
npx eas-cli credentials
```

If the key is lost, nobody can update the app in place. They would have to uninstall and lose their data.

## Push notifications on Android (optional for the first APK)

Without this the app works fully, but no notification arrives when the app is closed. To turn it on you need Google's
free Firebase Cloud Messaging: create a Firebase project, add an Android app with the package ID above, then follow
Expo's "FCM credentials" guide to upload the service account key through `eas credentials`.

## Later: Google Play

1. Register at play.google.com/console as a **personal** developer. One-time **$25**. Google verifies your ID, which takes
   a few days. If your local card is declined, a dollar or virtual card usually works.
2. A new personal account must run a **closed test with at least 12 testers for 14 days** before it can publish publicly.
   Start this early. Testers are people who opt in with their Google account.
3. Build the store file: `pnpm --filter @ricochet/mobile build:android:store` (an AAB), then upload it in Play Console.
4. The listing needs: the 512x512 icon, a 1024x500 feature graphic, phone screenshots, a short and long description,
   the **privacy policy URL** (the website's `/privacy` page, which must be deployed), the Data safety form, and a
   content rating questionnaire.
5. **Account deletion is required** for apps that let people create accounts: people must be able to ask for their account
   and data to be deleted from inside the app, and there must be a web page describing how. Ricochet does not have this
   yet. It must exist before the Play listing goes public.

## Where things live

| What | Where |
| --- | --- |
| App name, package ID, permissions, icons | `apps/mobile/app.json` |
| Build profiles and the API address | `apps/mobile/eas.json` |
| Stops a build that has no https API address | `apps/mobile/scripts/check-build-env.mjs` |
| Launcher icon, adaptive icon, notification icon | `apps/mobile/assets/images/` |
| Support email (Help and feedback, privacy policy) | `packages/shared/src/contact.ts`, `apps/web/lib/constants.ts` |
