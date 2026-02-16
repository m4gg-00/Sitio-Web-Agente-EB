
import { Property, Testimonial, SiteContent } from './types';

export const COLORS = {
  burgundy: '#800020',
  burgundyHover: '#600018',
  neutralLight: '#F9FAFB',
  neutralDark: '#111827',
};

export const CONTACT_INFO = {
  name: 'Escarleth Barreras',
  agency: 'Nueva Visión',
  whatsapp: '+526633157034',
  email: 'escarlethbarreras24@gmail.com',
  instagram: 'escarlethbarreras222',
  facebook: 'https://www.facebook.com/profile.php?id=100085171969437&ref=PROFILE_EDIT_xav_ig_profile_page_web',
};

export const DEFAULT_PROFILE: SiteContent = {
  displayName: 'Escarleth Barreras',
  heroTitle: 'Más que vender propiedades, creo historias y nuevos comienzos',
  heroSub: 'Te acompaño con honestidad y transparencia para vender o traspasar tu propiedad en Tijuana y Rosarito.',
  profilePic: 'https://picsum.photos/seed/escarleth-profile/400/400',
  bioShort: 'Asesora inmobiliaria en Tijuana y Rosarito. Te acompaño con honestidad, transparencia y atención personalizada para vender o traspasar tu propiedad con total seguridad.',
  bioLong: 'Soy Escarleth Barreras, una profesional apasionada del sector inmobiliario en Baja California. Mi enfoque no es solo cerrar tratos, sino construir relaciones de confianza. Con mi certificación Infonavit y mi experiencia en Nueva Visión, aseguro que cada paso de tu proceso de compra o venta sea claro, legal y beneficioso para tu patrimonio.',
  whatsapp: '+526633157034',
  email: 'escarlethbarreras24@gmail.com',
  instagram: 'escarlethbarreras222',
  facebook: 'https://www.facebook.com/profile.php?id=100085171969437&ref=PROFILE_EDIT_xav_ig_profile_page_web',
};

export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Casa Contemporánea en Santa Fe',
    city: 'Tijuana',
    zone: 'Santa Fe 5ta Sección',
    price: 2450000,
    currency: 'MXN',
    valuation: 2600000,
    type: 'Casa',
    status: 'Disponible',
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    description: 'Hermosa propiedad recién remodelada con acabados de lujo. Ideal para familias jóvenes que buscan seguridad y plusvalía.',
    amenities: ['Seguridad 24/7', 'Patio Trasero', 'Cocina Integral'],
    images: ['https://picsum.photos/seed/prop1/800/600', 'https://picsum.photos/seed/prop1b/800/600'],
    createdAt: new Date().toISOString(),
    isPublished: true,
  },
  {
    id: '2',
    title: 'Departamento Vista al Mar',
    city: 'Rosarito',
    zone: 'Playas de Rosarito Centro',
    price: 185000,
    currency: 'USD',
    valuation: 200000,
    type: 'Departamento',
    status: 'Disponible',
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    description: 'Disfruta de los atardeceres más increíbles desde tu balcón. Acceso directo a la playa.',
    amenities: ['Alberca', 'Gimnasio', 'Acceso a Playa'],
    images: ['https://picsum.photos/seed/prop2/800/600'],
    createdAt: new Date().toISOString(),
    isPublished: true,
  },
  {
    id: '3',
    title: 'Terreno Comercial Estratégico',
    city: 'Tijuana',
    zone: 'Otay Universidad',
    price: 3500000,
    currency: 'MXN',
    type: 'Terreno',
    status: 'Disponible',
    bedrooms: 0,
    bathrooms: 0,
    parking: 0,
    description: 'Excelente oportunidad para inversionistas. Ubicado en zona de alto flujo peatonal y vehicular.',
    amenities: ['Servicios a pie de calle', 'Nivelado'],
    images: ['https://picsum.photos/seed/prop3/800/600'],
    createdAt: new Date().toISOString(),
    isPublished: true,
  },
  {
    id: '4',
    title: 'Casa en Residencial Verona',
    city: 'Tijuana',
    zone: 'Cuesta Blanca',
    price: 2100000,
    currency: 'MXN',
    valuation: 2250000,
    type: 'Casa',
    status: 'Apartada',
    bedrooms: 3,
    bathrooms: 2.5,
    parking: 2,
    description: 'Casa con excelente distribución en fraccionamiento privado con amenidades exclusivas.',
    amenities: ['Casa Club', 'Parques', 'Acceso Controlado'],
    images: ['https://picsum.photos/seed/prop4/800/600'],
    createdAt: new Date().toISOString(),
    isPublished: true,
  }
];

export const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Roberto Méndez',
    text: 'Escarleth nos brindó una atención excepcional. Su transparencia en el proceso del Infonavit nos dio mucha tranquilidad.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Ana Laura Silva',
    text: 'Gracias a su gestión pudimos vender nuestra propiedad en menos de 2 meses. Siempre profesional y atenta.',
    rating: 5,
  }
];
