import { Property, SiteContent, Lead, Testimonial } from '../types';
import { DEFAULT_PROFILE, MOCK_PROPERTIES, MOCK_TESTIMONIALS } from '../constants';

const API_BASE = '/api';

const secureFetch = async (url: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("API_NOT_FOUND");
      }
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Error ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (err: any) {
    if (err.message === "API_NOT_FOUND") throw err;
    if (err.message.includes('Failed to fetch')) {
      throw new Error("No se pudo conectar con el servidor. Verifica tu conexión.");
    }
    throw err;
  }
};

export const apiService = {
  async login(password: string): Promise<boolean> {
    try {
      const res = await secureFetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      return res.ok;
    } catch (err: any) {
      if (err.message === "API_NOT_FOUND") {
        throw new Error("API no disponible en preview. Esto funcionará al desplegar en Cloudflare.");
      }
      throw err;
    }
  },

  async logout(): Promise<void> {
    await secureFetch(`${API_BASE}/admin/logout`, { method: 'POST' }).catch(() => {});
  },

  async checkAuth(): Promise<boolean> {
    try {
      const res = await secureFetch(`${API_BASE}/admin/me`);
      return res.ok;
    } catch {
      return false;
    }
  },

  // Testimonios
  async getTestimonials(all: boolean = false): Promise<Testimonial[]> {
    try {
      const url = all ? `${API_BASE}/admin/testimonials` : `${API_BASE}/testimonials`;
      const res = await secureFetch(url);
      const data = await res.json();
      return data.map((t: any) => ({
        ...t,
        approved: t.approved === 1
      }));
    } catch (err: any) {
      console.warn("getTestimonials: Usando datos de respaldo (Mock)");
      return MOCK_TESTIMONIALS;
    }
  },

  async saveTestimonial(testimonial: Partial<Testimonial>): Promise<void> {
    await secureFetch(`${API_BASE}/testimonials`, {
      method: 'POST',
      body: JSON.stringify(testimonial)
    });
  },

  async approveTestimonial(id: string): Promise<void> {
    await secureFetch(`${API_BASE}/admin/testimonials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ approved: true })
    });
  },

  async deleteTestimonial(id: string): Promise<void> {
    await secureFetch(`${API_BASE}/admin/testimonials/${id}`, {
      method: 'DELETE'
    });
  },

  async getProperties(all: boolean = false): Promise<Property[]> {
    try {
      const url = all ? `${API_BASE}/admin/properties` : `${API_BASE}/properties`;
      const res = await secureFetch(url);
      const data = await res.json();
      
      return data.map((p: any) => ({
        ...p,
        amenities: typeof p.amenities === 'string' ? JSON.parse(p.amenities || '[]') : (p.amenities || []),
        images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || []),
        isPublished: Boolean(p.isPublished)
      }));
    } catch (err: any) {
      console.warn("getProperties: Usando datos de respaldo (Mock)");
      return MOCK_PROPERTIES;
    }
  },

  async saveProperty(property: Property): Promise<void> {
    const isNew = !property.id;
    const url = isNew ? `${API_BASE}/admin/properties` : `${API_BASE}/admin/properties/${property.id}`;
    const method = isNew ? 'POST' : 'PUT';
    
    const body = {
      ...property,
      amenities: Array.isArray(property.amenities) ? property.amenities : [],
      images: Array.isArray(property.images) ? property.images : [],
      isPublished: property.isPublished ? 1 : 0
    };

    await secureFetch(url, { method, body: JSON.stringify(body) });
  },

  async deleteProperty(id: string): Promise<void> {
    await secureFetch(`${API_BASE}/admin/properties/${id}`, { method: 'DELETE' });
  },

  async getLeads(): Promise<Lead[]> {
    try {
      const res = await secureFetch(`${API_BASE}/admin/leads`);
      return await res.json();
    } catch {
      return [];
    }
  },

  async saveLead(lead: Partial<Lead>): Promise<void> {
    const isNew = !lead.id;
    const url = isNew ? `${API_BASE}/leads` : `${API_BASE}/admin/leads/${lead.id}`;
    const method = isNew ? 'POST' : 'PUT';
    
    await secureFetch(url, { method, body: JSON.stringify(lead) });
  },

  async deleteLead(id: string): Promise<void> {
    await secureFetch(`${API_BASE}/admin/leads/${id}`, { method: 'DELETE' });
  },

  async getProfile(): Promise<SiteContent> {
    try {
      const res = await secureFetch(`${API_BASE}/profile`);
      const data = await res.json();
      return data || DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  async saveProfile(profile: SiteContent): Promise<void> {
    await secureFetch(`${API_BASE}/admin/profile`, {
      method: 'PUT',
      body: JSON.stringify(profile)
    });
  },

  async uploadImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};