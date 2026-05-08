export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 32 }}>
      <h1>Hermes GUI Proxy</h1>
      <p>Next.js API proxy is running.</p>
      <ul>
        <li><code>POST /api/hermes/chat</code></li>
        <li><code>GET /api/hermes/health</code></li>
        <li><code>GET /api/hermes/capabilities</code></li>
      </ul>
    </main>
  );
}
