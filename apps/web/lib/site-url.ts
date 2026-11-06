// Set NEXT_PUBLIC_SITE_URL to pin it. Otherwise Vercel's variables give the production domain on
// production and the deployment's own address on previews.
export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const host =
    process.env.VERCEL_ENV === "production"
      ? (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL)
      : process.env.VERCEL_URL;

  if (explicit) return new URL(explicit);
  if (host) return new URL(`https://${host}`);
  return new URL(`http://localhost:${process.env.PORT ?? 3000}`);
}
