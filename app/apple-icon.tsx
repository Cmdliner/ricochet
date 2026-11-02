import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#fafafa" }}>
        <svg width="180" height="180" viewBox="0 0 32 32">
          <path d="M7.5 9 14 23 22 12" fill="none" stroke="#000" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="25" cy="8.5" r="2.4" fill="#000" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
