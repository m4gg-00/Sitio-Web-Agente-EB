import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ShieldCheck, TrendingUp, Key, ArrowRight, MessageCircle, Star, Send } from 'lucide-react';
import { CONTACT_INFO, MOCK_TESTIMONIALS } from '../constants';
import PropertyCard from '../components/PropertyCard';
import { apiService } from '../services/apiService';
import { Property, SiteContent, Testimonial } from '../types';

const Home: React.FC = () => {
  const [featured, setFeatured] = useState<Property[]>([]);
  const [profile, setProfile] = useState<SiteContent | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Formulario de reseña
  const [revName, setRevName] = useState('');
  const [revText, setRevText] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revStatus, setRevStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', msg: string }>({ type: 'idle', msg: '' });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [props, prof, tests] = await Promise.allSettled([
          apiService.getProperties(false),
          apiService.getProfile(),
          apiService.getTestimonials(false)
        ]);

        if (props.status === 'fulfilled') setFeatured(props.value.slice(0, 3));
        if (prof.status === 'fulfilled') setProfile(prof.value);

        // Fallback para testimonios
        if (tests.status === 'fulfilled' && tests.value.length > 0) {
          setTestimonials(tests.value);
        } else {
          setTestimonials(MOCK_TESTIMONIALS);
        }
      } catch (err) {
        console.error("Error loading home data:", err);
        setTestimonials(MOCK_TESTIMONIALS);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevStatus({ type: 'loading', msg: 'Enviando...' });
    try {
      await apiService.saveTestimonial({ name: revName, text: revText, rating: revRating });
      setRevStatus({ type: 'success', msg: '¡Gracias! Tu reseña será publicada tras revisión.' });
      setRevName('');
      setRevText('');
      setRevRating(5);
    } catch (err: any) {
      setRevStatus({ type: 'error', msg: err.message || 'Error al enviar.' });
    }
  };

  const steps = [
    { title: 'Escucho tu necesidad', desc: 'Entiendo qué buscas y cuáles son tus objetivos financieros y familiares.', icon: <MessageCircle className="text-[#800020] dark:text-[#ff3b5c]" /> },
    { title: 'Propuesta estratégica', desc: 'Diseño un plan de búsqueda o venta basado en datos reales del mercado.', icon: <TrendingUp className="text-[#800020] dark:text-[#ff3b5c]" /> },
    { title: 'Acompañamiento total', desc: 'Te guío en cada visita, negociación y revisión de documentos.', icon: <ShieldCheck className="text-[#800020] dark:text-[#ff3b5c]" /> },
    { title: 'Cierre seguro', desc: 'Aseguro que la transacción sea transparente y legal hasta la entrega de llaves.', icon: <Key className="text-[#800020] dark:text-[#ff3b5c]" /> },
  ];

  if (isLoading) return <div className="pt-40 pb-40 text-center dark:text-white">Cargando...</div>;

  return (
    <div className="pt-20 bg-white dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=1920" className="w-full h-full object-cover opacity-10 dark:opacity-5" alt="Background" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50/70 dark:from-gray-900/70 to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 py-20">
          <div className="max-w-3xl text-center lg:text-left">
            <span className="inline-block px-4 py-1 mb-6 text-xs font-bold text-white bg-[#800020] rounded-full uppercase tracking-widest">Certificación Infonavit</span>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
              {profile?.heroTitle || 'Nuevos comienzos inmobiliarios.'}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">{profile?.bioShort}</p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <a href={`https://wa.me/${(profile?.whatsapp || CONTACT_INFO.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="bg-[#800020] text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-[#600018] flex items-center gap-2">
                <MessageCircle size={20} /> WhatsApp
              </a>
              <Link to="/propiedades" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border px-8 py-4 rounded-xl font-bold hover:bg-gray-50">Ver Catálogo</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        {/* ✅ Encabezado que pediste (como la demo) */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            ¿CÓMO TE <span className="text-[#800020] dark:text-[#ff3b5c]">ACOMPAÑO</span>?
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300 text-base md:text-lg">
            Mi metodología se basa en la confianza mutua para asegurar que cada paso sea sólido y sin sorpresas.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-transparent hover:border-[#800020]/20 transition-all">
              <div className="mb-4">{s.icon}</div>
              <h3 className="font-bold text-lg mb-2 dark:text-white">{s.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold dark:text-white uppercase mb-4">Lo que dicen mis clientes</h2>
            <p className="text-gray-500">Historias de éxito y confianza.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((t) => (
                <div key={t.id} className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className={i < t.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 italic mb-6">"{t.text}"</p>
                  <div className="font-bold uppercase text-sm dark:text-white">— {t.name}</div>
                </div>
              ))}
            </div>

            {/* Formulario de Reseña */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl h-fit">
              <h3 className="text-xl font-bold mb-6 dark:text-white">Deja tu reseña</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <input required placeholder="Tu nombre" className="w-full p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl dark:text-white" value={revName} onChange={e => setRevName(e.target.value)} />
                <div className="flex gap-2 justify-center py-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setRevRating(n)} className="focus:outline-none">
                      <Star size={24} className={n <= revRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                    </button>
                  ))}
                </div>
                <textarea required placeholder="Escribe tu comentario (mín. 10 carac.)" rows={4} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl dark:text-white" value={revText} onChange={e => setRevText(e.target.value)} />
                <button type="submit" disabled={revStatus.type === 'loading'} className="w-full bg-[#800020] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#600018] disabled:opacity-50">
                  <Send size={18} /> {revStatus.type === 'loading' ? 'Enviando...' : 'Publicar Reseña'}
                </button>
                {revStatus.msg && <p className={`text-center text-xs font-bold mt-2 ${revStatus.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>{revStatus.msg}</p>}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto bg-[#111827] text-white p-12 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div>
            <h2 className="text-3xl font-bold mb-2">¿Buscas vender, comprar o traspasar tu propiedad?</h2>
            <p className="text-gray-400">Hagamos una valoración gratuita hoy mismo y tracemos la mejor opción para ti.</p>
          </div>
          <Link to="/contacto#formulario" className="bg-[#800020] px-10 py-4 rounded-xl font-bold hover:bg-[#600018]">Solicitar Asesoría</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;