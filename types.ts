export type PropertyStatus = 'Disponible' | 'Apartada' | 'Vendida';
export type PropertyType = 'Casa' | 'Departamento' | 'Terreno' | 'Local';
export type City = 'Tijuana' | 'Rosarito';

export interface Property {
  id: string;
  title: string;
  city: City;
  zone: string;
  price: number;
  currency: 'MXN' | 'USD';
  valuation?: number; // Avalúo
  type: PropertyType;
  status: PropertyStatus;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  description: string;
  amenities: string[];
  videoUrl?: string;
  mapsLink?: string; // Estandarizado a mapsLink
  images: string[];
  createdAt: string;
  isPublished?: boolean; // Campo nuevo para visibilidad
}

export type LeadStatus = 'nuevo' | 'contactado' | 'en seguimiento' | 'cerrado';

export interface Lead {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email?: string;
  cityInterest: City;
  operationType: 'Comprar' | 'Vender' | 'Traspasar';
  budget?: string; // Mantenido por compatibilidad
  budgetAmount?: number | null;
  budgetCurrency?: 'MXN' | 'USD';
  message?: string;
  propertyId?: string;
  propertyTitle?: string;
  source: 'home' | 'contacto' | 'propiedad';
  status: LeadStatus;
  notes?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  approved?: boolean;
  createdAt?: string;
}

export interface SiteContent {
  displayName: string;
  heroTitle: string;
  heroSub: string;
  profilePic: string;
  bioShort: string;
  bioLong: string;
  whatsapp: string;
  email: string;
  instagram: string;
  facebook: string;
}