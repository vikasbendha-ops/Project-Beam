"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafaf9",
          color: "#1c1917",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            Beam crashed
          </h1>
          <p style={{ marginTop: 12, color: "#57534e", fontSize: 14 }}>
            A fatal error stopped the app. Try reloading.
          </p>
          {error.digest ? (
            <p
              style={{
                marginTop: 16,
                fontFamily: "ui-monospace, monospace",
                fontSize: 11,
                color: "#78716c",
              }}
            >
              ref · {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              background: "#4f46e5",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
