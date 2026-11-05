import { ImageResponse } from "next/og";

export const alt = "Ricochet - Conversations that bounce right back";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#100e0d",
          color: "#f6f1ea",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="80" height="80" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="9" fill="#e9714e" />
            <path d="M7.5 9 14 23 22 12" fill="none" stroke="#1f0c05" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="25" cy="8.5" r="2.4" fill="#1f0c05" />
          </svg>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 600 }}>ricochet</div>
        </div>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 600, lineHeight: 1.05, maxWidth: 900 }}>
          Conversations that bounce right back.
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#aaa196" }}>
          Hubs, private chats, voice messages and video notes.
        </div>
      </div>
    ),
    { ...size },
  );
}
