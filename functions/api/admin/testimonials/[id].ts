export async function onRequestPatch(context) {
  const { env, params, request } = context;
  const kv = env.COMMENTS_KV;
  const id = params.id;

  try {
    const data = await request.json();
    const raw = await kv.get(`comment:${id}`);
    if (!raw) return new Response(JSON.stringify({ error: "No encontrado" }), { status: 404 });

    const comment = JSON.parse(raw);
    
    if (data.approved !== undefined) comment.approved = data.approved;
    
    await kv.put(`comment:${id}`, JSON.stringify(comment));
    return new Response(JSON.stringify({ success: true }));
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  const kv = env.COMMENTS_KV;
  const id = params.id;

  try {
    const raw = await kv.get(`comment:${id}`);
    if (!raw) return new Response(JSON.stringify({ error: "No encontrado" }), { status: 404 });

    const comment = JSON.parse(raw);
    
    // SOFT DELETE
    comment.status = "deleted";
    comment.approved = false; // Opcional: desaprobar al borrar
    
    await kv.put(`comment:${id}`, JSON.stringify(comment));
    
    return new Response(JSON.stringify({ success: true }));
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}