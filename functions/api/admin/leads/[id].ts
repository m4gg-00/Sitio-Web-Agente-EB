
export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const data = await request.json();
    await env.DB.prepare("UPDATE leads SET status = ?, notes = ? WHERE id = ?")
      .bind(data.status, data.notes, params.id).run();
    return new Response(JSON.stringify({ success: true }));
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  try {
    await env.DB.prepare("DELETE FROM leads WHERE id = ?").bind(params.id).run();
    return new Response(JSON.stringify({ success: true }));
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
