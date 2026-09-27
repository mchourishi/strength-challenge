import { ImageResponse } from "next/og";

// App icon drawn with plain shapes (two linked rings = two friends) so no fonts,
// emoji or network access are needed to render it.
export function renderIcon(size: number, { maskable = false } = {}) {
  const inset = maskable ? size * 0.2 : size * 0.14;
  const ring = (size - inset * 2) * 0.56;
  const stroke = Math.max(2, size * 0.075);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ff5a36 0%, #ff2e74 100%)",
          borderRadius: maskable ? 0 : size * 0.22,
        }}
      >
        <div style={{ display: "flex", position: "relative", width: ring * 1.62, height: ring }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              width: ring,
              height: ring,
              borderRadius: ring,
              border: `${stroke}px solid rgba(255,255,255,0.95)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              width: ring,
              height: ring,
              borderRadius: ring,
              border: `${stroke}px solid rgba(255,255,255,0.7)`,
            }}
          />
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
