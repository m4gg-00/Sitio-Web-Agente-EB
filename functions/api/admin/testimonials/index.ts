export async function onRequestGet(context) {
  const { env } = context;
  const kv = env.COMMENTS_KV;

  if (!kv) {
    return new Response(JSON.stringify({ error: "KV binding 'COMMENTS_KV' no encontrado" }), { status: 500 });
  }

  try {
    const list = await kv.list({ prefix: "comment:" });
    const comments = await Promise.all(
      list.keys.map(async (k) => {
        const val = await kv.get(k.name);
        return val ? JSON.parse(val) : null;
      })
    );

    // En admin mostramos todos (incluyendo eliminados) para auditoría
    const sorted = comments
      .filter(c => c !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return new Response(JSON.stringify(sorted), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}