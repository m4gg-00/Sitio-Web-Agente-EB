export async function onRequestPut(context: any) {
  const { request, env, params } = context;

  try {
    const data = await request.json().catch(() => ({}));

    // D1 NO acepta undefined. Convertimos a null y/o ignoramos campos undefined.
    const status = data?.status ?? null;
    const notes = data?.notes ?? null;

    // Si tu columna updatedAt existe, puedes descomentar esto:
    // const updatedAt = new Date().toISOString();

    await env.DB
      .prepare(`UPDATE leads SET status = ?, notes = ? WHERE id = ?`)
      .bind(status, notes, String(params.id))
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "DB error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestDelete(context: any) {
  const { env, params } = context;

  try {
    await env.DB.prepare("DELETE FROM leads WHERE id = ?")
      .bind(String(params.id))
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "DB error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}