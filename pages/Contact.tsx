
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, MessageCircle } from 'lucide-react';
import { CONTACT_INFO } from '../constants';
import LeadForm from '../components/LeadForm';
import { toFacebookUrl, toInstagramUrl, toWhatsAppUrl, toMailTo } from '../utils/links';

const Contact: React.FC = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [hash]);

  const whatsappUrl = toWhatsAppUrl(CONTACT_INFO.whatsapp, "Hola Escarleth, me gustaría solicitar asesoría inmobiliaria.");
  const emailUrl = toMailTo(CONTACT_INFO.email, "Consulta Inmobiliaria - Web");
  const fbUrl = toFacebookUrl(CONTACT_INFO.facebook);
  const igUrl = toInstagramUrl(CONTACT_INFO.instagram);

  return (
    <div className="pt-24 pb-32 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-tight">
            Estamos para <span className="text-[#800020] dark:text-[#ff3b5c]">Ayudarte</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
            ¿Buscas vender, comprar o traspasar? Escarleth Barreras te brinda asesoría 
            certificada y acompañamiento honesto en todo el proceso.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Info Side */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 uppercase tracking-widest border-b border-gray-50 dark:border-gray-700 pb-4">Datos de Contacto</h3>
              
              <div className="space-y-8">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-burgundy/5 dark:bg-burgundy/10 text-[#800020] dark:text-[#ff3b5c] rounded-2xl flex items-center justify-center group-hover:bg-[#800020] group-hover:text-white transition-all">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">WhatsApp Directo</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{CONTACT_INFO.whatsapp}</p>
                  </div>
                </a>

                <a 
                  href={emailUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-12 h-12 bg-burgundy/5 dark:bg-burgundy/10 text-[#800020] dark:text-[#ff3b5c] rounded-2xl flex items-center justify-center group-hover:bg-[#800020] group-hover:text-white transition-all">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Correo Electrónico</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white break-all">{CONTACT_INFO.email}</p>
                  </div>
                </a>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-burgundy/5 dark:bg-burgundy/10 text-[#800020] dark:text-[#ff3b5c] rounded-2xl flex items-center justify-center">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Cobertura</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">Tijuana y Rosarito, B.C.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#111827] dark:bg-black text-white p-8 rounded-3xl shadow-sm border border-transparent dark:border-gray-800">
              <h4 className="font-bold text-lg mb-4 uppercase tracking-widest text-white/50">Síguenos</h4>
              <div className="flex gap-4">
                {igUrl && (
                  <a href={igUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-[#800020] transition-colors">
                    <Instagram size={24} />
                  </a>
                )}
                {fbUrl && (
                  <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-[#800020] transition-colors">
                    <Facebook size={24} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Form Side - Added scroll-mt-28 to handle sticky navbar offset */}
          <div id="formulario" className="lg:col-span-7 scroll-mt-28">
            <LeadForm source="contacto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
