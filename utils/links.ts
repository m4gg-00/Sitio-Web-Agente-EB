/**
 * Utilidades para normalización de enlaces y comunicación externa.
 * Evita URLs duplicadas y comportamientos inesperados en SPAs.
 */

export const toAbsoluteUrl = (value: string): string => {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
};

export const toFacebookUrl = (value: string): string => {
  if (!value) return '';
  const trimmed = value.trim().replace(/#$/, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.includes('facebook.com')) return `https://${trimmed.replace(/^https?:\/\/(www\.)?/, '')}`;
  const slug = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
  return `https://facebook.com/${slug}`;
};

export const toInstagramUrl = (value: string): string => {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.includes('instagram.com')) return `https://${trimmed.replace(/^https?:\/\/(www\.)?/, '')}`;
  const slug = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
  return `https://instagram.com/${slug}`;
};

export const toWhatsAppUrl = (phone: string, text?: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  let url = `https://wa.me/${digits}`;
  if (text) {
    url += `?text=${encodeURIComponent(text)}`;
  }
  return url;
};

/**
 * Genera un enlace de redacción de Gmail para evitar que los navegadores
 * rompan la SPA al intentar abrir clientes de correo locales no configurados.
 */
export const toMailTo = (email: string, subject?: string, body?: string): string => {
  if (!email) return '';
  const base = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
  const s = subject ? `&su=${encodeURIComponent(subject)}` : '';
  const b = body ? `&body=${encodeURIComponent(body)}` : '';
  return `${base}${s}${b}`;
};
