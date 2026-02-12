export default function Home() {
  return (
    <div style={{ padding: "40px", fontFamily: "monospace", textAlign: "center" }}>
      <h1>SM-CRM API Server</h1>
      <p style={{ color: "#666" }}>Backend is running. API available at <code>/api/*</code></p>
      <p style={{ color: "#888", fontSize: "14px", marginTop: "20px" }}>
        Health check: <a href="/api/health">/api/health</a>
      </p>
    </div>
  );
}
