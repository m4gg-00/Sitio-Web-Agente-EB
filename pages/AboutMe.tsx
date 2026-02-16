
import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { SiteContent } from '../types';
import { CONTACT_INFO, DEFAULT_PROFILE } from '../constants';
import { Instagram, Facebook, Mail, Phone, ShieldCheck, Award } from 'lucide-react';
import { toFacebookUrl, toInstagramUrl, toWhatsAppUrl, toMailTo } from '../utils/links';

const AboutMe: React.FC = () => {
  const [profile, setProfile] = useState<SiteContent | null>(null);

  useEffect(() => {
    apiService.getProfile().then(setProfile).catch(() => setProfile(DEFAULT_PROFILE));
  }, []);

  if (!profile) return null;

  const facebookUrl = toFacebookUrl(profile.facebook);
  const instagramUrl = toInstagramUrl(profile.instagram);
  const whatsappUrl = toWhatsAppUrl(profile.whatsapp, "Hola Escarleth, vi tu perfil en 'Sobre Mí' y me gustaría recibir asesoría.");
  const emailUrl = toMailTo(profile.email, "Asesoría Inmobiliaria - Contacto desde Web");

  return (
    <div className="pt-24 pb-20 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Side: Photo & Badges */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-8 border-gray-50 dark:border-gray-800">
              <img 
                src={profile.profilePic} 
                alt={profile.displayName} 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating Badge */}
            <div className="absolute -bottom-6 -right-6 bg-[#800020] text-white p-6 rounded-2xl shadow-xl flex items-center gap-4 border-4 border-white dark:border-gray-800">
              <Award size={40} />
              <div>
                <p className="font-bold text-lg uppercase tracking-wider">Certificación</p>
                <p className="text-white/80 text-sm">Infonavit Vigente</p>
              </div>
            </div>
          </div>

          {/* Right Side: Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                Sobre <span className="text-[#800020]">Mí</span>
              </h1>
              <p className="text-[#800020] dark:text-[#ff3b5c] font-bold text-xl uppercase tracking-widest">{CONTACT_INFO.agency}</p>
            </div>

            <div className="space-y-6 text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
              <p className="font-medium text-gray-900 dark:text-white">{profile.bioShort}</p>
              <p className="whitespace-pre-line">{profile.bioLong}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <ShieldCheck className="text-[#800020] dark:text-[#ff3b5c] mb-2" size={24} />
                <h3 className="font-bold text-gray-900 dark:text-white">Honestidad</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Transparencia en cada documento.</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <ShieldCheck className="text-[#800020] dark:text-[#ff3b5c] mb-2" size={24} />
                <h3 className="font-bold text-gray-900 dark:text-white">Seguridad</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cierres seguros ante notario.</p>
              </div>
            </div>

            {/* Social & Contact */}
            <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">Conectemos</h3>
              <div className="flex flex-wrap gap-4">
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-[#800020] dark:text-[#ff3b5c]"
                >
                  <Phone size={20} />
                  <span className="font-semibold">{profile.whatsapp}</span>
                </a>
                <a 
                  href={emailUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-[#800020] dark:text-[#ff3b5c]"
                >
                  <Mail size={20} />
                  <span className="font-semibold">Enviar Correo</span>
                </a>
              </div>
              <div className="flex gap-6 mt-8">
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#800020] dark:hover:text-[#ff3b5c] transition-colors">
                    <Instagram size={24} />
                  </a>
                )}
                {facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#800020] dark:hover:text-[#ff3b5c] transition-colors">
                    <Facebook size={24} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutMe;
