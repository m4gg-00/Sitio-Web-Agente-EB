export async function onRequestPost(context) {
  const { request, env } = context;
  
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "D1 database binding 'DB' is missing" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await request.json();
    const id = crypto.randomUUID();
    
    await env.DB.prepare(`
      INSERT INTO leads (
        id, name, phone, email, cityInterest, operationType, budget, message, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, data.name, data.phone, data.email || null, data.cityInterest, 
      data.operationType, data.budget || null, data.message || null, 
      new Date().toISOString()
    ).run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}