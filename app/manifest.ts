import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ricochet",
    short_name: "Ricochet",
    description: "Real-time messaging with hubs, private chats, voice messages and video notes.",
    start_url: "/",
    display: "standalone",
    background_color: "#100e0d",
    theme_color: "#100e0d",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
