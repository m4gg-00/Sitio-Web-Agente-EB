export async function onRequestPost(context) {
  const { request, env } = context;
  const { password } = await request.json();

  const adminCode = env.ADMIN_CODE;
  const sessionSecret = env.SESSION_SECRET;

  if (!adminCode || !sessionSecret) {
    return new Response(JSON.stringify({ 
      error: "Error de configuración: Faltan variables de entorno (ADMIN_CODE o SESSION_SECRET)" 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  if (password === adminCode) {
    const sessionId = crypto.randomUUID();
    const encoder = new TextEncoder();
    
    // Firma HMAC para la sesión
    const sigKey = await crypto.subtle.importKey(
      "raw", encoder.encode(sessionSecret), { name: 'HMAC', hash: 'SHA-256' }, 
      false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', sigKey, encoder.encode(sessionId));
    const sigHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    const cookieValue = `${sessionId}.${sigHex}`;
    
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `eb_session=${cookieValue}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
      }
    });
  }

  return new Response(JSON.stringify({ error: 'Código de acceso incorrecto' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}