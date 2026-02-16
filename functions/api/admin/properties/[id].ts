
export async function onRequestGet(context) {
  const { env, params } = context;
  const p = await env.DB.prepare("SELECT * FROM properties WHERE id = ?").bind(params.id).first();
  if (!p) return new Response(null, { status: 404 });
  
  const formatted = {
    ...p,
    amenities: typeof p.amenities === 'string' ? JSON.parse(p.amenities || '[]') : (p.amenities || []),
    images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || []),
    isPublished: p.isPublished === 1
  };
  return new Response(JSON.stringify(formatted), { headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const data = await request.json();
    
    // Serialización forzada a JSON string para D1
    const amenitiesJson = JSON.stringify(data.amenities || []);
    const imagesJson = JSON.stringify(data.images || []);

    await env.DB.prepare(`
      UPDATE properties SET 
        title = ?, city = ?, zone = ?, price = ?, currency = ?, 
        valuation = ?, type = ?, status = ?, bedrooms = ?, 
        bathrooms = ?, parking = ?, description = ?, amenities = ?, 
        videoUrl = ?, mapsLink = ?, images = ?, isPublished = ?
      WHERE id = ?
    `).bind(
      data.title, data.city, data.zone, data.price, data.currency, 
      data.valuation || null, data.type, data.status, data.bedrooms, 
      data.bathrooms, data.parking, data.description, 
      amenitiesJson, 
      data.videoUrl || null, data.mapsLink || null, 
      imagesJson, 
      data.isPublished ? 1 : 0, 
      params.id
    ).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  try {
    await env.DB.prepare("DELETE FROM properties WHERE id = ?").bind(params.id).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
