export async function onRequestGet(context) {
  const { env } = context;
  
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "D1 database binding 'DB' is missing" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM properties WHERE isPublished = 1 ORDER BY createdAt DESC"
    ).all();
    
    const formatted = results.map(p => ({
      ...p,
      amenities: typeof p.amenities === 'string' ? JSON.parse(p.amenities || '[]') : (p.amenities || []),
      images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || []),
      isPublished: true
    }));
    
    return new Response(JSON.stringify(formatted), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}