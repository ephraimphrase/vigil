import { ImageResponse } from "next/og";

export const alt = "Vigil — Autonomous protocol risk monitoring";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(ellipse 900px 500px at 12% -10%, rgba(176,108,225,0.35), transparent 60%), radial-gradient(ellipse 700px 500px at 100% 15%, rgba(75,58,168,0.4), transparent 60%), #0a0712",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 68,
              height: 68,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px solid #b06ce1",
              color: "#E5DBF1",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            V
          </div>
          <div style={{ display: "flex", fontSize: 58, fontWeight: 800, letterSpacing: 6, color: "#E5DBF1" }}>
            VIGIL
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 44,
            fontSize: 34,
            lineHeight: 1.4,
            color: "#C9C9C9",
            maxWidth: 920,
          }}
        >
          Autonomous protocol risk monitoring and consequence execution system.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 52,
            gap: 28,
            fontSize: 20,
            color: "#b06ce1",
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          <span>Real-time health scores</span>
          <span>·</span>
          <span>Automated de-risking</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
