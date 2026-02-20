import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit,
  Trash2,
  LogOut,
  LayoutDashboard,
  User,
  MessageSquare,
  Menu,
  CheckCircle,
  X,
  AlertTriangle,
  Star,
  RefreshCw
} from 'lucide-react';

import { apiService } from '../../services/apiService';
import { Property, SiteContent, Lead } from '../../types';

type Tab = 'properties' | 'profile' | 'leads' | 'reviews';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('properties');

  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [profile, setProfile] = useState<SiteContent | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Modal Propiedades
  const [isEditing, setIsEditing] = useState(false);
  const [currentProp, setCurrentProp] = useState<Partial<Property>>({});
  const [amenitiesText, setAmenitiesText] = useState<string>(''); // UI helper
  const [imagesText, setImagesText] = useState<string>(''); // UI helper (multi URLs)

  // UI
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<null | { type: 'property' | 'lead' | 'review'; id: string }>(null);

  useEffect(() => {
    const init = async () => {
      const isAuth = await apiService.checkAuth();
      if (!isAuth) {
        navigate('/admin/login');
        return;
      }
      refreshData();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [p, l, prof, tests] = await Promise.allSettled([
        apiService.getProperties(true),
        apiService.getLeads(),
        apiService.getProfile(),
        apiService.getTestimonials(true)
      ]);

      if (p.status === 'fulfilled') setProperties(p.value);
      if (l.status === 'fulfilled') setLeads(l.value);
      if (prof.status === 'fulfilled') setProfile(prof.value);
      if (tests.status === 'fulfilled') setTestimonials(tests.value);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await apiService.logout();
    navigate('/');
  };

  const handleApproveReview = async (id: string) => {
    try {
      await apiService.approveTestimonial(id);
      setTestimonials(prev => prev.map(t => (t.id === id ? { ...t, approved: true } : t)));
    } catch {
      alert('Error al aprobar.');
    }
  };

  const confirmDeleteNow = async () => {
    if (!confirmDelete) return;

    try {
      if (confirmDelete.type === 'property') {
        await apiService.deleteProperty(confirmDelete.id);
        setProperties(prev => prev.filter(p => p.id !== confirmDelete.id));
      } else if (confirmDelete.type === 'lead') {
        await apiService.deleteLead(confirmDelete.id);
        setLeads(prev => prev.filter(l => l.id !== confirmDelete.id));
      } else if (confirmDelete.type === 'review') {
        await apiService.deleteTestimonial(confirmDelete.id);
        setTestimonials(prev =>
          prev.map(t => (t.id === confirmDelete.id ? { ...t, status: 'deleted', approved: false } : t))
        );
      }
    } catch {
      alert('Error al eliminar.');
    }

    setConfirmDelete(null);
  };

  const openNewPropertyModal = () => {
    const base: any = {
      title: '',
      city: 'Tijuana',
      zone: '',
      price: 0,
      currency: 'MXN',
      valuation: null,
      type: 'Casa',
      status: 'Disponible',
      bedrooms: null,
      bathrooms: null,
      parking: null,
      description: '',
      amenities: [],
      videoUrl: null,
      mapsLink: null,
      images: [],
      isPublished: true
    };

    setCurrentProp(base);
    setAmenitiesText('');
    setImagesText('');
    setIsEditing(true);
  };

  const openEditPropertyModal = (p: Property) => {
    setCurrentProp(p as any);

    const a = Array.isArray((p as any).amenities) ? (p as any).amenities : [];
    setAmenitiesText(a.join(', '));

    const imgs = Array.isArray((p as any).images) ? (p as any).images : [];
    setImagesText(imgs.join('\n'));

    setIsEditing(true);
  };

  const parseAmenities = (txt: string): string[] =>
    txt
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

  const parseImages = (txt: string): string[] =>
    txt
      .split(/\r?\n|,/g)
      .map(s => s.trim())
      .filter(Boolean);

  const saveProperty = async () => {
    try {
      // IMPORTANTÍSIMO: NUNCA mandar undefined a D1
      const payload: any = {
        // si existe id, se edita; si no, backend genera uno
        id: (currentProp as any).id ?? null,

        title: (currentProp as any).title ?? '',
        city: (currentProp as any).city ?? 'Tijuana',
        zone: (currentProp as any).zone ?? '',
        price: Number((currentProp as any).price ?? 0),

        currency: (currentProp as any).currency ?? 'MXN',
        valuation:
          (currentProp as any).valuation === '' || (currentProp as any).valuation === undefined
            ? null
            : (currentProp as any).valuation ?? null,

        type: (currentProp as any).type ?? 'Casa',
        status: (currentProp as any).status ?? 'Disponible',

        bedrooms:
          (currentProp as any).bedrooms === '' || (currentProp as any).bedrooms === undefined
            ? null
            : (currentProp as any).bedrooms ?? null,
        bathrooms:
          (currentProp as any).bathrooms === '' || (currentProp as any).bathrooms === undefined
            ? null
            : (currentProp as any).bathrooms ?? null,
        parking:
          (currentProp as any).parking === '' || (currentProp as any).parking === undefined
            ? null
            : (currentProp as any).parking ?? null,

        description: (currentProp as any).description ?? '',

        amenities: parseAmenities(amenitiesText),
        images: parseImages(imagesText),

        videoUrl: (currentProp as any).videoUrl ?? null,
        mapsLink: (currentProp as any).mapsLink ?? null,

        isPublished: Boolean((currentProp as any).isPublished ?? true),

        // si backend lo pide, no le mandes undefined
        createdAt: (currentProp as any).createdAt ?? null
      };

      // Limpieza extra para D1: undefined -> null
      Object.keys(payload).forEach(k => {
        if (payload[k] === undefined) payload[k] = null;
      });

      await apiService.saveProperty(payload);
      await refreshData();
      setIsEditing(false);
    } catch (e: any) {
      alert(e?.message || 'Error al guardar la propiedad');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white">
        Cargando Panel...
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row transition-colors overflow-hidden">
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-[45] lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-[#111827] text-white z-50 transform transition-transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-white/10 flex justify-between items-center">
            <h1 className="text-xl font-bold uppercase tracking-tighter">
              Admin <span className="text-[#800020]">Panel</span>
            </h1>
            <button onClick={() => setIsMobileSidebarOpen(false)} className="lg:hidden p-1">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-grow p-4 space-y-2">
            <button
              onClick={() => {
                setActiveTab('properties');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'properties' ? 'bg-[#800020]' : 'hover:bg-white/5'
                }`}
            >
              <LayoutDashboard size={20} /> <span className="font-semibold">Propiedades</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('leads');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'leads' ? 'bg-[#800020]' : 'hover:bg-white/5'
                }`}
            >
              <MessageSquare size={20} /> <span className="font-semibold">Leads</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('reviews');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'reviews' ? 'bg-[#800020]' : 'hover:bg-white/5'
                }`}
            >
              <Star size={20} /> <span className="font-semibold">Reseñas</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('profile');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-[#800020]' : 'hover:bg-white/5'
                }`}
            >
              <User size={20} /> <span className="font-semibold">Perfil</span>
            </button>
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-500/10"
            >
              <LogOut size={20} /> <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="lg:hidden mb-4 flex justify-between items-center">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 bg-[#111827] text-white rounded-lg"
          >
            <Menu size={24} />
          </button>

          <button
            onClick={refreshData}
            className="p-2 bg-gray-200 dark:bg-gray-800 rounded-lg dark:text-white"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* PROPIEDADES */}
        {activeTab === 'properties' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold dark:text-white uppercase tracking-tight">Propiedades</h2>

              <button
                onClick={openNewPropertyModal}
                className="bg-[#800020] text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-[#600018]"
              >
                Nueva Propiedad
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {properties.length === 0 ? (
                <div className="text-center text-gray-500 py-20 border-2 border-dashed rounded-3xl">
                  No hay propiedades registradas aún. Haz clic en <b>Nueva Propiedad</b> para agregar la primera.
                </div>
              ) : (
                properties.map(p => (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-gray-800 p-4 rounded-2xl flex items-center justify-between border dark:border-gray-700 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={(p as any).images?.[0] || ''}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-200"
                        alt=""
                      />
                      <div>
                        <div className="font-bold dark:text-white">{p.title}</div>
                        <div className="text-xs text-gray-500">{(p as any).city}</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => openEditPropertyModal(p)} className="p-2 text-blue-500">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => setConfirmDelete({ type: 'property', id: p.id })} className="p-2 text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* RESEÑAS */}
        {activeTab === 'reviews' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold dark:text-white uppercase tracking-tighter">
                Moderación de Reseñas (KV)
              </h2>

              <button
                onClick={refreshData}
                className="text-[#800020] dark:text-[#ff3b5c] font-bold text-sm flex items-center gap-2"
              >
                <RefreshCw size={16} /> Actualizar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {testimonials.map(t => (
                <div
                  key={t.id}
                  className={`p-6 rounded-3xl border shadow-sm transition-all ${t.status === 'deleted' ? 'opacity-50 grayscale' : ''
                    } ${t.approved
                      ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                      : 'bg-[#800020]/5 dark:bg-[#800020]/10 border-[#800020]/20'
                    }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-bold text-lg dark:text-white flex items-center gap-2">
                        {t.name}
                        {t.status === 'deleted' && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase font-bold tracking-tighter">
                            Eliminado
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1 py-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>

                      <div className="text-[10px] text-gray-400 font-mono">{new Date(t.createdAt).toLocaleString()}</div>
                    </div>

                    {!t.approved && t.status !== 'deleted' && (
                      <span className="bg-[#800020] text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse">
                        Pendiente
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 italic mb-6">"{t.text}"</p>

                  <div className="flex justify-end gap-3 border-t dark:border-gray-700 pt-4">
                    {!t.approved && t.status !== 'deleted' && (
                      <button
                        onClick={() => handleApproveReview(t.id)}
                        className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl hover:bg-green-100 transition-colors"
                      >
                        <CheckCircle size={18} /> Aprobar
                      </button>
                    )}

                    {t.status !== 'deleted' && (
                      <button
                        onClick={() => setConfirmDelete({ type: 'review', id: t.id })}
                        className="flex items-center gap-2 text-red-600 font-bold text-sm bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={18} /> Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {testimonials.length === 0 && (
                <p className="text-center text-gray-500 py-20 border-2 border-dashed rounded-3xl">
                  No hay reseñas registradas en KV.
                </p>
              )}
            </div>
          </div>
        )}

        {/* LEADS */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold dark:text-white">Interesados</h2>
              <button
                onClick={refreshData}
                className="text-[#800020] dark:text-[#ff3b5c] font-bold text-sm flex items-center gap-2"
              >
                <RefreshCw size={16} /> Actualizar
              </button>
            </div>

            {leads.length === 0 ? (
              <p className="text-center text-gray-500 py-20 border-2 border-dashed rounded-3xl">
                No hay leads registrados.
              </p>
            ) : (
              leads.map(l => (
                <div
                  key={l.id}
                  className="bg-white dark:bg-gray-800 p-5 rounded-2xl border dark:border-gray-700 flex justify-between items-center shadow-sm"
                >
                  <div>
                    <div className="font-bold dark:text-white">{l.name}</div>
                    <div className="text-sm text-gray-500">{l.phone}</div>
                  </div>

                  <button
                    onClick={() => setConfirmDelete({ type: 'lead', id: l.id })}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* PERFIL (solo lectura) */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold dark:text-white uppercase tracking-tighter">Perfil</h2>
              <button
                onClick={refreshData}
                className="text-[#800020] dark:text-[#ff3b5c] font-bold text-sm flex items-center gap-2"
              >
                <RefreshCw size={16} /> Actualizar
              </button>
            </div>

            {!profile ? (
              <div className="text-center text-gray-500 py-20 border-2 border-dashed rounded-3xl">
                No hay información de perfil cargada.
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Nombre</div>
                    <div className="font-bold dark:text-white">{(profile as any).displayName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">WhatsApp</div>
                    <div className="font-bold dark:text-white">{(profile as any).whatsapp}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-xs text-gray-500">Hero Title</div>
                    <div className="font-bold dark:text-white">{(profile as any).heroTitle}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-xs text-gray-500">Bio</div>
                    <div className="dark:text-white whitespace-pre-wrap">{(profile as any).bioLong}</div>
                  </div>
                </div>

                <div className="mt-6 text-xs text-gray-500">
                  Si quieres que el perfil sea editable desde aquí, dime cómo se llama el método en tu apiService
                  (por ejemplo: <b>updateProfile</b> / <b>saveProfile</b>) y te lo dejo completo.
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: Crear / Editar Propiedad */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-3xl p-6 border dark:border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold dark:text-white">
                {(currentProp as any)?.id ? 'Editar Propiedad' : 'Nueva Propiedad'}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 dark:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold dark:text-white">Título</label>
                <input
                  className="w-full mt-1 p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={(currentProp as any).title ?? ''}
                  onChange={e => setCurrentProp(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-semibold dark:text-white">Ciudad</label>
                <select
                  className="w-full mt-1 p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={(currentProp as any).city ?? 'Tijuana'}
                  onChange={e => setCurrentProp(prev => ({ ...prev, city: e.target.value as any }))}
                >
                  <option value="Tijuana">Tijuana</option>
                  <option value="Rosarito">Rosarito</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold dark:text-white">Zona</label>
                <input
                  className="w-full mt-1 p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={(currentProp as any).zone ?? ''}
                  onChange={e => setCurrentProp(prev => ({ ...prev, zone: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-semibold dark:text-white">Precio</label>
                <input
                  type="number"
                  className="w-full mt-1 p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={Number((currentProp as any).price ?? 0)}
                  onChange={e => setCurrentProp(prev => ({ ...prev, price: Number(e.target.value) }))}
                />
              </div>

              <div>
                <label className="text-sm font-semibold dark:text-white">Moneda</label>
                <select
                  className="w-full mt-1 p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={(currentProp as any).currency ?? 'MXN'}
                  onChange={e => setCurrentProp(prev => ({ ...prev, currency: e.target.value }))}
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold dark:text-white">Valoración (opcional)</label>
                <input
                  type="number"
                  className="w-full mt-1 p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={(currentProp as any).valuation ?? ''}
                  onChange={e =>
                    setCurrentProp(prev => ({
                      ...prev,
                      valuation: e.target.value === '' ? null : Number(e.target.value)
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-semibold dark:text-white">Tipo</label>
                <select
                  className="w-full mt-1 p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={(currentProp as any).type ?? 'Casa'}
                  onChange={e => setCurrentProp(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <option value="Casa">Casa</option>
                  <option value="Departamento">Departamento</option>
                  <option value="Terreno">Terreno</option>
                  <option value="Local">Local</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold dark:text-white">Estatus</label>
                <select
                  className="w-full mt-1 p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={(currentProp as any).status ?? 'Disponible'}
                  onChange={e => setCurrentProp(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Apartada">Apartada</option>
                  <option value="Vendida">Vendida</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold dark:text-white">Recámaras (opcional)</label>
                <input
                  type="number"
                  className="w-full mt-1 p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={(currentProp as any).bedrooms ?? ''}
                  onChange={e =>
                    setCurrentProp(prev => ({
                      ...prev,
                      bedrooms: e.target.value === '' ? null : Number(e.target.value)
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-semibold dark:text-white">Baños (opcional)</label>
                <input
                  type="number"
                  className="w-full mt-1 p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={(currentProp as any).bathrooms ?? ''}
                  onChange={e =>
                    setCurrentProp(prev => ({
                      ...prev,
                      bathrooms: e.target.value === '' ? null : Number(e.target.value)
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-semibold dark:text-white">Estacionamientos (opcional)</label>
                <input
                  type="number"
                  className="w-full mt-1 p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={(currentProp as any).parking ?? ''}
                  onChange={e =>
                    setCurrentProp(prev => ({
                      ...prev,
                      parking: e.target.value === '' ? null : Number(e.target.value)
                    }))
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold dark:text-white">Descripción</label>
                <textarea
                  className="w-full mt-1 p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white min-h-[110px]"
                  value={(currentProp as any).description ?? ''}
                  onChange={e => setCurrentProp(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold dark:text-white">Amenidades (separadas por coma)</label>
                <input
                  className="w-full mt-1 p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={amenitiesText}
                  onChange={e => setAmenitiesText(e.target.value)}
                  placeholder="Alberca, Patio, Seguridad, ..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold dark:text-white">
                  Imágenes (URLs, una por línea o separadas por coma)
                </label>
                <textarea
                  className="w-full mt-1 p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white min-h-[90px]"
                  value={imagesText}
                  onChange={e => setImagesText(e.target.value)}
                  placeholder="https://...\nhttps://..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold dark:text-white">Video URL (opcional)</label>
                <input
                  className="w-full mt-1 p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={(currentProp as any).videoUrl ?? ''}
                  onChange={e => setCurrentProp(prev => ({ ...prev, videoUrl: e.target.value || null }))}
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold dark:text-white">Maps Link (opcional)</label>
                <input
                  className="w-full mt-1 p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={(currentProp as any).mapsLink ?? ''}
                  onChange={e => setCurrentProp(prev => ({ ...prev, mapsLink: e.target.value || null }))}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean((currentProp as any).isPublished ?? true)}
                  onChange={e => setCurrentProp(prev => ({ ...prev, isPublished: e.target.checked }))}
                />
                <span className="text-sm dark:text-white">Publicada</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 dark:text-white font-bold"
              >
                Cancelar
              </button>

              <button
                onClick={saveProperty}
                className="px-6 py-2 rounded-xl bg-[#800020] text-white font-bold hover:bg-[#600018] shadow-lg"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md p-8 text-center animate-in zoom-in duration-200">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-2xl font-bold dark:text-white mb-2">¿Estás seguro?</h3>
            <p className="text-gray-500 mb-8">
              {confirmDelete.type === 'review'
                ? 'La reseña no se eliminará físicamente pero dejará de ser visible para los clientes.'
                : 'Esta acción no se puede deshacer.'}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteNow}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;