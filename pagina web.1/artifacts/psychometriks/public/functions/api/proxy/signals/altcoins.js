export async function onRequest() {
  try {
    const resp = await fetch(
      "https://signalsbotpaginaweb-production.up.railway.app/api/altcoin-signals",
      { headers: { Accept: "application/json" } }
    );
    const data = await resp.json();
    return Response.json(data, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  } catch (err) {
    return Response.json({ error: "Proxy error", detail: String(err) }, { status: 502 });
  }
}
