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
      "SELECT * FROM properties ORDER BY createdAt DESC"
    ).all();
    
    const formatted = results.map(p => ({
      ...p,
      amenities: typeof p.amenities === 'string' ? JSON.parse(p.amenities || '[]') : (p.amenities || []),
      images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || []),
      isPublished: p.isPublished === 1
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
    const id = data.id || crypto.randomUUID();
    
    const amenitiesJson = JSON.stringify(data.amenities || []);
    const imagesJson = JSON.stringify(data.images || []);

    await env.DB.prepare(`
      INSERT OR REPLACE INTO properties (
        id, title, city, zone, price, currency, valuation, type, status, 
        bedrooms, bathrooms, parking, description, amenities, videoUrl, 
        mapsLink, images, isPublished, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, data.title, data.city, data.zone, data.price, data.currency, 
      data.valuation || null, data.type, data.status, data.bedrooms, 
      data.bathrooms, data.parking, data.description, 
      amenitiesJson, 
      data.videoUrl || null, data.mapsLink || null, 
      imagesJson, 
      data.isPublished ? 1 : 0, 
      data.createdAt || new Date().toISOString()
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