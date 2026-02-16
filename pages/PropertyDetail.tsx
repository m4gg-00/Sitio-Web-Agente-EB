
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  BedDouble, Bath, Car, MapPin, Share2, Heart, 
  MessageCircle, ArrowLeft, CheckCircle2, Phone, Calendar, ExternalLink
} from 'lucide-react';
import { Property, SiteContent } from '../types';
import { apiService } from '../services/apiService';
import { CONTACT_INFO } from '../constants';
import { toWhatsAppUrl, toMailTo } from '../utils/links';

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [profile, setProfile] = useState<SiteContent | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const [allProps, prof] = await Promise.all([
          apiService.getProperties(false),
          apiService.getProfile()
        ]);
        const found = allProps.find(p => p.id === id);
        if (found) {
          setProperty(found);
        } else {
          navigate('/propiedades');
        }
        setProfile(prof);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  if (isLoading) return <div className="pt-32 text-center dark:text-white">Cargando propiedad...</div>;
  if (!property) return null;

  const whatsappUrl = toWhatsAppUrl(
    (profile?.whatsapp || CONTACT_INFO.whatsapp),
    `Hola Escarleth, vi la propiedad "${property.title}" en tu sitio web. Me gustaría agendar una visita y saber más detalles. ¿Cuándo tienes disponibilidad?`
  );

  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: property.currency,
  }).format(property.price);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Mira esta propiedad en ${property.city}: ${property.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  const mapsLink = property.mapsLink || "";

  return (
    <div className="pt-20 pb-32 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors min-h-screen">
      {/* Top Navigation Bar */}
      <div className="bg-gray-50 dark:bg-gray-800 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <Link to="/propiedades" className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-[#800020] dark:hover:text-[#ff3b5c]">
            <ArrowLeft size={16} className="mr-2" />
            Volver al listado
          </Link>
          <div className="flex gap-4">
            <button 
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-[#800020] dark:hover:text-[#ff3b5c] transition-colors"
              title="Compartir propiedad"
            >
              <Share2 size={20} />
            </button>
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className={`p-2 transition-colors ${isLiked ? 'text-red-600 fill-red-600' : 'text-gray-400 hover:text-red-500'}`}
              title="Añadir a favoritos"
            >
              <Heart size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content (Images + Description) */}
          <div className="lg:col-span-8">
            <div className="space-y-6">
              {/* Gallery */}
              <div className="space-y-4">
                <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
                  <img
                    src={property.images[activeImg] || 'https://via.placeholder.com/800x450?text=No+Image'}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {property.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImg(idx)}
                      className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                        activeImg === idx ? 'border-[#800020] ring-4 ring-[#800020]/10 dark:ring-[#ff3b5c]/10' : 'border-transparent'
                      }`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Header Info */}
              <div className="py-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                    property.status === 'Disponible' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    property.status === 'Apartada' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {property.status}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 text-sm">• {property.type}</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{property.title}</h1>
                
                <div className="flex flex-col gap-2 mb-6">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <MapPin size={18} className="mr-2 text-[#800020] dark:text-[#ff3b5c]" />
                    <span>{property.city}, {property.zone}</span>
                  </div>
                  {mapsLink && (
                    <a 
                      href={mapsLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center text-[#800020] dark:text-[#ff3b5c] hover:underline text-sm font-bold ml-6"
                    >
                      <ExternalLink size={14} className="mr-1" />
                      Ver en Google Maps
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-50 dark:border-gray-800">
                  <div className="text-center">
                    <p className="text-gray-400 dark:text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Recámaras</p>
                    <div className="flex items-center justify-center gap-2">
                      <BedDouble className="text-[#800020] dark:text-[#ff3b5c]" size={20} />
                      <span className="text-xl font-bold text-gray-900 dark:text-white">{property.bedrooms}</span>
                    </div>
                  </div>
                  <div className="text-center border-x border-gray-100 dark:border-gray-800">
                    <p className="text-gray-400 dark:text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Baños</p>
                    <div className="flex items-center justify-center gap-2">
                      <Bath className="text-[#800020] dark:text-[#ff3b5c]" size={20} />
                      <span className="text-xl font-bold text-gray-900 dark:text-white">{property.bathrooms}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 dark:text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Cochera</p>
                    <div className="flex items-center justify-center gap-2">
                      <Car className="text-[#800020] dark:text-[#ff3b5c]" size={20} />
                      <span className="text-xl font-bold text-gray-900 dark:text-white">{property.parking}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="py-6">
                <h3 className="text-xl font-bold mb-4 uppercase tracking-tight text-gray-900 dark:text-white">Descripción</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line text-lg">
                  {property.description}
                </p>
              </div>

              {/* Amenities */}
              <div className="py-6">
                <h3 className="text-xl font-bold mb-6 uppercase tracking-tight text-gray-900 dark:text-white">Amenidades y Características</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {property.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-transparent dark:border-gray-700">
                      <CheckCircle2 size={18} className="text-[#800020] dark:text-[#ff3b5c]" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar CTA Card */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-6">
              <div className="bg-[#111827] dark:bg-black text-white p-8 rounded-3xl shadow-2xl border border-transparent dark:border-gray-800">
                <p className="text-gray-400 text-sm mb-2 uppercase tracking-widest font-bold">Precio de Venta</p>
                <div className="text-4xl font-bold mb-4">{formattedPrice} <span className="text-xl font-normal text-gray-400">{property.currency}</span></div>
                
                {property.valuation && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-8">
                    <p className="text-xs text-gray-400 uppercase tracking-tighter mb-1">Avalúo Comercial</p>
                    <p className="text-lg font-bold text-[#800020] dark:text-[#ff3b5c]">
                      {new Intl.NumberFormat('es-MX', { style: 'currency', currency: property.currency }).format(property.valuation)}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#800020] text-white py-4 rounded-xl flex items-center justify-center font-bold text-lg hover:bg-[#600018] transition-all gap-3 active:scale-95"
                  >
                    <MessageCircle size={22} />
                    Agendar Visita
                  </a>
                </div>
                <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-4">
                  <img 
                    src={profile?.profilePic || 'https://via.placeholder.com/100?text=EB'} 
                    alt={profile?.displayName || "Escarleth Barreras"} 
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#800020] dark:border-[#ff3b5c]" 
                  />
                  <div>
                    <p className="font-bold">{profile?.displayName || 'Escarleth Barreras'}</p>
                    <p className="text-xs text-gray-400">Asesora Inmobiliaria</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Contacto: {profile?.whatsapp || CONTACT_INFO.whatsapp}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
