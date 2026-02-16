
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Instagram, Facebook, MapPin } from 'lucide-react';
import { CONTACT_INFO } from '../constants';
import { toFacebookUrl, toInstagramUrl, toWhatsAppUrl } from '../utils/links';

const Footer: React.FC = () => {
  const fbUrl = toFacebookUrl(CONTACT_INFO.facebook);
  const igUrl = toInstagramUrl(CONTACT_INFO.instagram);
  const waUrl = toWhatsAppUrl(CONTACT_INFO.whatsapp);

  return (
    <footer className="bg-[#111827] text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-tight">
              Escarleth <span className="text-[#800020]">Barreras</span>
            </h3>
            <p className="text-sm leading-relaxed mb-6">
              Asesoría inmobiliaria profesional, honesta y transparente en Tijuana y Rosarito. Creamos historias y nuevos comienzos.
            </p>
            <div className="flex space-x-4">
              {igUrl && (
                <a href={igUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  <Instagram size={20} />
                </a>
              )}
              {fbUrl && (
                <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  <Facebook size={20} />
                </a>
              )}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-6">Navegación</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/" className="hover:text-[#800020] transition-colors">Inicio</Link></li>
              <li><Link to="/propiedades" className="hover:text-[#800020] transition-colors">Propiedades</Link></li>
              <li><Link to="/sobre-mi" className="hover:text-[#800020] transition-colors">Sobre Mí</Link></li>
              <li><Link to="/contacto" className="hover:text-[#800020] transition-colors">Contacto</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-white font-semibold mb-6">Contacto</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center space-x-3">
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 hover:text-white transition-colors">
                  <Phone size={18} className="text-[#800020]" />
                  <span>{CONTACT_INFO.whatsapp}</span>
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-[#800020]" />
                <span>{CONTACT_INFO.email}</span>
              </li>
              <li className="flex items-center space-x-3">
                <MapPin size={18} className="text-[#800020]" />
                <span>Tijuana y Rosarito, Baja California, México</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
          <p>© {new Date().getFullYear()} Escarleth Barreras - Nueva Visión. Todos los derechos reservados.</p>
          <div className="mt-4 md:mt-0 space-x-6">
            <Link to="/privacidad" className="hover:text-white">Aviso de Privacidad</Link>
            <Link to="/admin" className="hover:text-white">Acceso</Link>
          </div>
        </div>

        {/* Credits line */}
        <div className="mt-6 text-[10px] text-gray-500 text-center md:text-right uppercase tracking-widest opacity-60">
          Sitio web hecho por REDTT
        </div>
      </div>
    </footer>
  );
};

export default Footer;
