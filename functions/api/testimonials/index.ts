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

    // Filtrar: Solo aprobados y no eliminados
    const filtered = comments
      .filter(c => c && c.approved === true && c.status !== "deleted")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return new Response(JSON.stringify(filtered), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.COMMENTS_KV;

  if (!kv) {
    return new Response(JSON.stringify({ error: "KV binding 'COMMENTS_KV' no encontrado" }), { status: 500 });
  }

  try {
    const data = await request.json();
    
    // Sanitización y Validación
    const name = (data.name || "").trim().substring(0, 60);
    const text = (data.text || "").trim().substring(0, 500);
    const rating = Math.min(Math.max(parseInt(data.rating) || 5, 1), 5);

    if (name.length < 2) throw new Error("Nombre muy corto");
    if (text.length < 10) throw new Error("Comentario muy corto");

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const newComment = {
      id,
      name,
      text,
      rating,
      approved: false,
      status: "visible",
      createdAt
    };

    await kv.put(`comment:${id}`, JSON.stringify(newComment));

    return new Response(JSON.stringify({ success: true, id }), { status: 201 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
}