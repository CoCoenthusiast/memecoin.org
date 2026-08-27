import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          backgroundColor: "#0a0e14",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 40 40"
          stroke="#4ade80"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="20,4 36,20 20,36 4,20" />
          <path d="M11,20 Q20,13 29,20 Q20,27 11,20" />
          <circle cx="20" cy="20" r="2" fill="#4ade80" stroke="none" />
        </svg>
        <div
          style={{
            marginTop: "20px",
            fontSize: "64px",
            fontWeight: "bold",
            color: "#4ade80",
            fontFamily: "monospace",
          }}
        >
          degenscult
        </div>
        <div
          style={{
            marginTop: "16px",
            fontSize: "24px",
            color: "#9ca3af",
            fontFamily: "monospace",
          }}
        >
          Community forum for memecoin discussion and trading culture
        </div>
      </div>
    ),
    { ...size }
  );
}
