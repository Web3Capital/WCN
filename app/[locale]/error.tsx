"use client";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: 40, maxWidth: 600, margin: "0 auto" }}>
      <h2>Error</h2>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f5f5f5", padding: 16, borderRadius: 8, fontSize: 13 }}>
        {error.message}
      </pre>
      {error.digest && (
        <p style={{ color: "#888", fontSize: 12 }}>Digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        style={{ marginTop: 16, padding: "8px 16px", cursor: "pointer" }}
      >
        Retry
      </button>
    </div>
  );
}
