
export async function onRequestPut(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    await env.DB.prepare(`
      UPDATE profile SET 
        displayName = ?, heroTitle = ?, heroSub = ?, profilePic = ?, 
        bioShort = ?, bioLong = ?, whatsapp = ?, email = ?, 
        instagram = ?, facebook = ?
      WHERE id = 1
    `).bind(
      data.displayName, data.heroTitle, data.heroSub, data.profilePic, 
      data.bioShort, data.bioLong, data.whatsapp, data.email, 
      data.instagram, data.facebook
    ).run();
    return new Response(JSON.stringify({ success: true }));
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
