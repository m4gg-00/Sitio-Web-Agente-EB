export async function onRequestGet(context) {
  const { request, env } = context;
  const cookie = request.headers.get('Cookie');
  const sessionCookie = cookie?.split('; ').find(row => row.startsWith('eb_session='))?.split('=')[1];
  const sessionSecret = env.SESSION_SECRET;

  if (!sessionCookie || !sessionSecret) {
    return new Response(JSON.stringify({ authenticated: false }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
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

    return new Response(JSON.stringify({ authenticated: isValid }), { 
      status: isValid ? 200 : 401,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response(JSON.stringify({ authenticated: false }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}