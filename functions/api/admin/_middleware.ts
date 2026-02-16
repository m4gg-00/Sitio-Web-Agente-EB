export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Permitir el acceso al endpoint de login sin autenticación
  if (url.pathname === '/api/admin/login') {
    return await context.next();
  }

  const cookie = request.headers.get('Cookie');
  const sessionCookie = cookie?.split('; ').find(row => row.startsWith('eb_session='))?.split('=')[1];
  const sessionSecret = env.SESSION_SECRET;

  if (!sessionSecret) {
    return new Response(JSON.stringify({ error: 'Configuración de servidor incompleta' }), { status: 500 });
  }

  if (!sessionCookie) {
    return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 401 });
  }

  try {
    const [sessionId, signature] = sessionCookie.split('.');
    const encoder = new TextEncoder();
    const sigKey = await crypto.subtle.importKey(
      "raw", encoder.encode(sessionSecret), { name: 'HMAC', hash: 'SHA-256' }, 
      false, ['verify']
    );
    
    const sigArray = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const isValid = await crypto.subtle.verify('HMAC', sigKey, sigArray, encoder.encode(sessionId));

    if (!isValid) throw new Error();
    return await context.next();
  } catch {
    return new Response(JSON.stringify({ error: 'Sesión inválida o expirada' }), { status: 401 });
  }
}