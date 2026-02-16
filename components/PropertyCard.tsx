
import React from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, Bath, Car, MapPin, MessageCircle } from 'lucide-react';
import { Property } from '../types';
import { CONTACT_INFO } from '../constants';
import { toWhatsAppUrl } from '../utils/links';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: property.currency,
    maximumFractionDigits: 0,
  }).format(property.price);

  const whatsappUrl = toWhatsAppUrl(
    CONTACT_INFO.whatsapp,
    `Hola Escarleth, me interesa la propiedad: ${property.title} (${property.id}). ¿Podrías darme más información?`
  );

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full">
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full text-white ${
            property.status === 'Disponible' ? 'bg-green-600' : 
            property.status === 'Apartada' ? 'bg-yellow-600' : 'bg-red-700'
          }`}>
            {property.status}
          </span>
          <span className="bg-black/50 backdrop-blur-md text-white px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider">
            {property.type}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-2">
          <MapPin size={14} className="mr-1" />
          <span className="uppercase tracking-wide">{property.city} | {property.zone}</span>
        </div>
        
        <Link to={`/propiedades/${property.id}`}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#800020] dark:group-hover:text-[#ff3b5c] transition-colors line-clamp-1">
            {property.title}
          </h3>
        </Link>
        
        <p className="text-2xl font-bold text-[#800020] dark:text-[#ff3b5c] mb-4">
          {formattedPrice} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{property.currency}</span>
        </p>

        {property.valuation && (
          <div className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-1 px-2 rounded mb-4 inline-block w-fit">
            Avalúo: <span className="font-semibold">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: property.currency }).format(property.valuation)}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-gray-600 dark:text-gray-400 py-4 border-t border-gray-50 dark:border-gray-700 mb-auto">
          <div className="flex items-center space-x-1">
            <BedDouble size={18} />
            <span className="text-sm">{property.bedrooms}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Bath size={18} />
            <span className="text-sm">{property.bathrooms}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Car size={18} />
            <span className="text-sm">{property.parking}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            to={`/propiedades/${property.id}`}
            className="flex-1 text-center py-2.5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            Ver Detalle
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 bg-[#800020] text-white rounded-lg hover:bg-[#600018] transition-colors"
            title="Preguntar por WhatsApp"
          >
            <MessageCircle size={20} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
