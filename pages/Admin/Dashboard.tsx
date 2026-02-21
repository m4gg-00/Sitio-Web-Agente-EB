import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Edit,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  User,
  X
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { City, Lead, Property, PropertyStatus, PropertyType, SiteContent } from '../../types';

type Tab = 'properties' | 'profile' | 'leads' | 'reviews';
type ConfirmDelete = null | { type: 'property' | 'lead' | 'review'; id: string };

// ==== Propiedades (NO se cambia tu lógica) ====
const CITIES: City[] = ['Tijuana', 'Rosarito'];
const TYPES: PropertyType[] = ['Casa', 'Departamento', 'Terreno', 'Local'];
const STATUS: PropertyStatus[] = ['Disponible', 'Apartada', 'Vendida'];

// ==== Leads (nuevo) ====
type LeadStatusUI = 'nuevo' | 'contactado' | 'en seguimiento' | 'cerrado';
const LEAD_STATUS: LeadStatusUI[] = ['nuevo', 'contactado', 'en seguimiento', 'cerrado'];
const LS_KEY = 'lead_status_map_v1';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const toNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const toInt = (v: any) => {
  const n = Math.trunc(toNum(v));
  return Number.isFinite(n) ? n : 0;
};

const emptyPropertyDraft = (): Property => ({
  id: '',
  title: '',
  city: 'Tijuana',
  zone: '',
  price: 0,
  currency: 'MXN',
  valuation: undefined,
  type: 'Casa',
  status: 'Disponible',
  bedrooms: 0,
  bathrooms: 0,
  parking: 0,
  description: '',
  amenities: [],
  videoUrl: '',
  mapsLink: '',
  images: [],
  createdAt: new Date().toISOString(),
  isPublished: true
});

const safeStr = (v: any) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const safeDateLabel = (iso: any) => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  } catch {
    return '';
  }
};

const getLeadStatusFromLead = (l: any): LeadStatusUI => {
  const raw = safeStr(l?.status).toLowerCase();
  if (raw === 'contactado') return 'contactado';
  if (raw === 'en seguimiento' || raw === 'seguimiento') return 'en seguimiento';
  if (raw === 'cerrado') return 'cerrado';
  return 'nuevo';
};

const statusBadge = (s: LeadStatusUI) => {
  switch (s) {
    case 'nuevo':
      return { label: 'NUEVO', cls: 'bg-[#800020]/10 text-[#800020] border-[#800020]/20' };
    case 'contactado':
      return { label: 'CONTACTADO', cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-900/40' };
    case 'en seguimiento':
      return { label: 'EN SEGUIMIENTO', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-900/40' };
    case 'cerrado':
      return { label: 'CERRADO', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-900/40' };
    default:
      return { label: 'NUEVO', cls: 'bg-[#800020]/10 text-[#800020] border-[#800020]/20' };
  }
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [profile, setProfile] = useState<SiteContent | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete>(null);

  // Modal editar/crear propiedad
  const [isEditing, setIsEditing] = useState(false);
  const [savingProp, setSavingProp] = useState(false);
  const [currentProp, setCurrentProp] = useState<Property>(emptyPropertyDraft());
  const [amenitiesText, setAmenitiesText] = useState('');
  const [imagesText, setImagesText] = useState(''); // URLs opcionales pegadas
  const [formError, setFormError] = useState<string>('');

  // Perfil
  const [profileMsg, setProfileMsg] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Leads UI
  const [leadQuery, setLeadQuery] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<'Todos' | LeadStatusUI>('Todos');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');

  // Lead status local persistence map
  const [leadStatusMap, setLeadStatusMap] = useState<Record<string, LeadStatusUI>>({});

  useEffect(() => {
    // Cargar statuses guardados
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && typeof obj === 'object') setLeadStatusMap(obj);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // Guardar statuses
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(leadStatusMap));
    } catch {
      // ignore
    }
  }, [leadStatusMap]);

  useEffect(() => {
    const init = async () => {
      const isAuth = await apiService.checkAuth();
      if (!isAuth) {
        navigate('/admin/login');
        return;
      }
      await refreshData();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        setLeads(prev => prev.filter(l => (l as any).id !== confirmDelete.id));
        setSelectedLeadId(prev => (prev === confirmDelete.id ? '' : prev));
        setLeadStatusMap(prev => {
          const copy = { ...prev };
          delete copy[confirmDelete.id];
          return copy;
        });
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

  // ===== PROPIEDADES (SIN CAMBIOS DE FONDO) =====
  const openNewProperty = () => {
    const draft = emptyPropertyDraft();
    setCurrentProp(draft);
    setAmenitiesText('');
    setImagesText('');
    setFormError('');
    setIsEditing(true);
  };

  const openEditProperty = (p: Property) => {
    const normalized: Property = {
      ...p,
      price: toNum((p as any).price),
      bedrooms: toInt((p as any).bedrooms),
      bathrooms: toInt((p as any).bathrooms),
      parking: toInt((p as any).parking),
      currency: (p as any).currency ?? 'MXN',
      images: Array.isArray((p as any).images) ? (p as any).images : [],
      amenities: Array.isArray((p as any).amenities) ? (p as any).amenities : [],
      isPublished: (p as any).isPublished ?? true
    };
    setCurrentProp(normalized);
    setAmenitiesText((normalized.amenities || []).join(', '));
    setImagesText('');
    setFormError('');
    setIsEditing(true);
  };

  const closePropertyModal = () => {
    setIsEditing(false);
    setSavingProp(false);
    setFormError('');
  };

  const addImagesFromText = () => {
    const urls = imagesText
      .split(/[\n,]+/g)
      .map(s => s.trim())
      .filter(Boolean);
    if (urls.length === 0) return;

    setCurrentProp(prev => ({
      ...prev,
      images: [...(prev.images || []), ...urls]
    }));
    setImagesText('');
  };

  const removeImageAt = (idx: number) => {
    setCurrentProp(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== idx)
    }));
  };

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFormError('');

    try {
      const uploads = await Promise.all(Array.from(files).map(f => (apiService as any).uploadImage(f)));
      setCurrentProp(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploads]
      }));
    } catch (e) {
      console.error(e);
      setFormError('No se pudieron cargar las imágenes. Intenta con archivos más pequeños.');
    }
  };

  const normalizePropertyForSave = (draft: Property): Property => {
    const amenities = amenitiesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const images = Array.isArray((draft as any).images) ? (draft as any).images.filter(Boolean) : [];

    const valuationRaw = (draft as any).valuation;
    const valuationNormalized =
      valuationRaw === undefined || valuationRaw === null || String(valuationRaw).trim() === ''
        ? undefined
        : toNum(valuationRaw);

    const normalized: Property = {
      ...(draft as any),
      title: safeStr((draft as any).title).trim(),
      zone: safeStr((draft as any).zone).trim(),
      description: safeStr((draft as any).description).trim(),
      price: toNum((draft as any).price),
      currency: (draft as any).currency === 'USD' ? 'USD' : 'MXN',
      valuation: valuationNormalized,
      type: (TYPES.includes((draft as any).type) ? (draft as any).type : 'Casa') as PropertyType,
      status: (STATUS.includes((draft as any).status) ? (draft as any).status : 'Disponible') as PropertyStatus,
      bedrooms: clamp(toInt((draft as any).bedrooms), 0, 99),
      bathrooms: clamp(toInt((draft as any).bathrooms), 0, 99),
      parking: clamp(toInt((draft as any).parking), 0, 99),
      amenities,
      images,
      videoUrl: safeStr((draft as any).videoUrl).trim(),
      mapsLink: safeStr((draft as any).mapsLink).trim(),
      isPublished: (draft as any).isPublished ?? true,
      createdAt: (draft as any).createdAt || new Date().toISOString()
    };

    return normalized;
  };

  const saveProperty = async () => {
    setSavingProp(true);
    setFormError('');

    try {
      const normalized = normalizePropertyForSave(currentProp);

      if (!normalized.title) return void setFormError('El título es obligatorio.'), setSavingProp(false);
      if (!normalized.zone) return void setFormError('La zona es obligatoria.'), setSavingProp(false);
      if (!normalized.description) return void setFormError('La descripción es obligatoria.'), setSavingProp(false);
      if (!normalized.images || normalized.images.length === 0)
        return void setFormError('Agrega al menos 1 imagen (archivo o URL).'), setSavingProp(false);

      await apiService.saveProperty(normalized as any);
      await refreshData();
      setIsEditing(false);
    } catch (e: any) {
      console.error(e);
      setFormError(e?.message ? `Error al guardar: ${e.message}` : 'Error al guardar. Revisa la consola y vuelve a intentar.');
    } finally {
      setSavingProp(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    setProfileMsg('');
    try {
      await apiService.saveProfile(profile);
      setProfileMsg('Perfil actualizado ✅');
    } catch (e) {
      console.error(e);
      setProfileMsg('No se pudo guardar el perfil.');
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg(''), 3000);
    }
  };

  const propertyCountLabel = useMemo(() => {
    const total = properties.length;
    const published = properties.filter(p => (p as any).isPublished).length;
    return `${published}/${total} publicadas`;
  }, [properties]);

  // ===== LEADS: status + filtro + layout demo =====
  const leadsEnriched = useMemo(() => {
    return (leads || []).map((l: any) => {
      const id = safeStr(l?.id);
      const statusFromLead = getLeadStatusFromLead(l);
      const status = leadStatusMap[id] ?? statusFromLead;
      return { ...l, id, __statusUI: status as LeadStatusUI };
    });
  }, [leads, leadStatusMap]);

  const leadsFiltered = useMemo(() => {
    const q = leadQuery.trim().toLowerCase();
    const statusFilter = leadStatusFilter;

    return leadsEnriched.filter((l: any) => {
      const statusOk = statusFilter === 'Todos' ? true : l.__statusUI === statusFilter;
      if (!statusOk) return false;

      if (!q) return true;

      const hay =
        [
          l?.name,
          l?.phone,
          l?.message,
          l?.propertyTitle,
          l?.propertyId,
          l?.operationType,
          l?.cityInterest,
          l?.city
        ]
          .map(safeStr)
          .join(' ')
          .toLowerCase();

      return hay.includes(q);
    });
  }, [leadsEnriched, leadQuery, leadStatusFilter]);

  useEffect(() => {
    // Selección default: primer lead filtrado
    if (activeTab !== 'leads') return;

    const exists = leadsFiltered.some((l: any) => l.id === selectedLeadId);
    if (!selectedLeadId || !exists) {
      setSelectedLeadId(leadsFiltered[0]?.id || '');
    }
  }, [activeTab, leadsFiltered, selectedLeadId]);

  const selectedLead = useMemo(() => {
    return leadsFiltered.find((l: any) => l.id === selectedLeadId) || null;
  }, [leadsFiltered, selectedLeadId]);

  const setLeadStatus = async (leadId: string, status: LeadStatusUI) => {
    // UI optimistic
    setLeadStatusMap(prev => ({ ...prev, [leadId]: status }));

    // Si tu apiService algún día tiene endpoint, aquí lo intentamos sin romper nada:
    try {
      const anyApi = apiService as any;
      if (typeof anyApi.updateLeadStatus === 'function') {
        await anyApi.updateLeadStatus(leadId, status);
      } else if (typeof anyApi.saveLead === 'function') {
        await anyApi.saveLead({ id: leadId, status });
      } else if (typeof anyApi.updateLead === 'function') {
        await anyApi.updateLead(leadId, { status });
      }
    } catch (e) {
      // No rompemos UI: mantenemos local, pero dejamos rastro en consola
      console.warn('No se pudo persistir status en backend. Se mantiene localStorage.', e);
    }
  };

  const openWhatsApp = (phoneRaw: any) => {
    const phone = safeStr(phoneRaw).replace(/[^\d]/g, '');
    if (!phone) return;
    window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
  };

  const callPhone = (phoneRaw: any) => {
    const phone = safeStr(phoneRaw).replace(/[^\d+]/g, '');
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  // ===== RENDER =====
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

        {/* ===================== PROPIEDADES ===================== */}
        {activeTab === 'properties' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold dark:text-white uppercase tracking-tight">
                  Propiedades
                </h2>
                <div className="text-xs text-gray-500 mt-1">{propertyCountLabel}</div>
              </div>

              <button
                onClick={openNewProperty}
                className="bg-[#800020] text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-[#600018] flex items-center gap-2"
              >
                <Plus size={18} /> Nueva Propiedad
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {properties.map((p: any) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-2xl flex items-center justify-between border dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={p.images?.[0] || ''}
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                      alt=""
                    />
                    <div className="min-w-0">
                      <div className="font-bold dark:text-white truncate">{p.title}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {p.city} · {p.zone} · {p.isPublished ? 'Publicada' : 'Oculta'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditProperty(p)}
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-white/5 rounded-lg"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ type: 'property', id: p.id })}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-white/5 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              {properties.length === 0 && (
                <div className="text-center text-gray-500 py-20 border-2 border-dashed rounded-3xl">
                  Aún no hay propiedades. Crea la primera con “Nueva Propiedad”.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== RESEÑAS ===================== */}
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
              {testimonials.map((t: any) => (
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
                            className={
                              i < (t.rating || 0)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }
                          />
                        ))}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {t.createdAt ? new Date(t.createdAt).toLocaleString() : ''}
                      </div>
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

        {/* ===================== LEADS (ACTUALIZADO) ===================== */}
        {activeTab === 'leads' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold dark:text-white">Interesados</h2>
              <button
                onClick={refreshData}
                className="text-[#800020] dark:text-[#ff3b5c] font-bold text-sm flex items-center gap-2"
              >
                <RefreshCw size={16} /> Actualizar
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: list */}
              <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-3xl p-5 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                  <input
                    className="flex-1 p-3 rounded-2xl border dark:border-gray-700 dark:bg-gray-900"
                    placeholder="Buscar lead (nombre, tel, mensaje...)"
                    value={leadQuery}
                    onChange={e => setLeadQuery(e.target.value)}
                  />
                  <select
                    className="md:w-56 p-3 rounded-2xl border dark:border-gray-700 dark:bg-gray-900"
                    value={leadStatusFilter}
                    onChange={e => setLeadStatusFilter(e.target.value as any)}
                  >
                    <option value="Todos">Estatus: Todos</option>
                    {LEAD_STATUS.map(s => (
                      <option key={s} value={s}>
                        Estatus: {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {leadsFiltered.map((l: any) => {
                    const isSel = l.id === selectedLeadId;
                    const badge = statusBadge(l.__statusUI);

                    return (
                      <button
                        key={l.id}
                        onClick={() => setSelectedLeadId(l.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all ${isSel
                            ? 'border-[#800020] bg-[#800020]/5'
                            : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-extrabold dark:text-white truncate">{safeStr(l.name) || 'Sin nombre'}</div>
                            <div className="text-sm text-gray-500 truncate">{safeStr(l.phone)}</div>
                            <div className="text-[11px] text-gray-400 mt-1">{safeDateLabel(l.createdAt)}</div>
                            {safeStr(l.message) && (
                              <div className="text-xs text-gray-500 mt-2 line-clamp-2">
                                {safeStr(l.message)}
                              </div>
                            )}
                          </div>
                          <span className={`shrink-0 text-[10px] font-extrabold uppercase px-2 py-1 rounded-full border ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {leadsFiltered.length === 0 && (
                    <div className="text-center text-gray-500 py-16 border-2 border-dashed rounded-3xl">
                      No hay leads con ese filtro.
                    </div>
                  )}
                </div>
              </div>

              {/* Right: detail */}
              <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-3xl p-6 shadow-sm">
                {!selectedLead ? (
                  <div className="text-center text-gray-500 py-20 border-2 border-dashed rounded-3xl">
                    Selecciona un lead para ver el detalle.
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-2xl font-extrabold dark:text-white truncate">
                          {safeStr((selectedLead as any).name) || 'Sin nombre'}
                        </div>
                        <div className="text-gray-500">{safeStr((selectedLead as any).phone)}</div>
                        <div className="text-xs text-gray-400 mt-1">{safeDateLabel((selectedLead as any).createdAt)}</div>
                      </div>

                      <button
                        onClick={() => setConfirmDelete({ type: 'lead', id: safeStr((selectedLead as any).id) })}
                        className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Eliminar lead"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* actions */}
                    <div className="flex flex-wrap gap-3 mt-5">
                      <button
                        onClick={() => openWhatsApp((selectedLead as any).phone)}
                        className="px-5 py-2.5 rounded-2xl font-extrabold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200"
                      >
                        WhatsApp
                      </button>
                      <button
                        onClick={() => callPhone((selectedLead as any).phone)}
                        className="px-5 py-2.5 rounded-2xl font-extrabold bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-950"
                      >
                        Llamar
                      </button>
                    </div>

                    {/* status selector */}
                    <div className="mt-5">
                      <label className="text-sm font-extrabold dark:text-white">
                        Estatus de seguimiento
                        <select
                          className="mt-2 w-full p-3 rounded-2xl border dark:border-gray-700 dark:bg-gray-900"
                          value={(selectedLead as any).__statusUI}
                          onChange={e => setLeadStatus(safeStr((selectedLead as any).id), e.target.value as LeadStatusUI)}
                        >
                          {LEAD_STATUS.map(s => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {/* message */}
                    <div className="mt-6 border dark:border-gray-700 rounded-2xl p-4">
                      <div className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Mensaje</div>
                      <div className="mt-2 text-gray-800 dark:text-gray-200">
                        {safeStr((selectedLead as any).message) || '—'}
                      </div>
                    </div>

                    {/* extra info (SIN Fuente / SIN Correo) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                      <div className="border dark:border-gray-700 rounded-2xl p-4">
                        <div className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Ciudad interés</div>
                        <div className="mt-2 font-bold dark:text-white">
                          {safeStr((selectedLead as any).cityInterest || (selectedLead as any).city) || '—'}
                        </div>
                      </div>

                      <div className="border dark:border-gray-700 rounded-2xl p-4">
                        <div className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Tipo de operación</div>
                        <div className="mt-2 font-bold dark:text-white">
                          {safeStr((selectedLead as any).operationType) || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== PERFIL ===================== */}
        {activeTab === 'profile' && profile && (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold dark:text-white">Perfil / Contenido</h2>
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="bg-[#800020] text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-[#600018] disabled:opacity-60"
              >
                {savingProfile ? 'Guardando...' : 'Guardar'}
              </button>
            </div>

            {profileMsg && <div className="mb-4 text-sm font-semibold text-[#800020]">{profileMsg}</div>}

            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm font-semibold dark:text-white">
                  Nombre a mostrar
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                    value={(profile as any).displayName}
                    onChange={e => setProfile({ ...(profile as any), displayName: e.target.value })}
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Foto (URL)
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                    value={(profile as any).profilePic}
                    onChange={e => setProfile({ ...(profile as any), profilePic: e.target.value })}
                  />
                </label>
              </div>

              <label className="text-sm font-semibold dark:text-white">
                Título hero
                <input
                  className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                  value={(profile as any).heroTitle}
                  onChange={e => setProfile({ ...(profile as any), heroTitle: e.target.value })}
                />
              </label>

              <label className="text-sm font-semibold dark:text-white">
                Subtítulo hero
                <input
                  className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                  value={(profile as any).heroSub}
                  onChange={e => setProfile({ ...(profile as any), heroSub: e.target.value })}
                />
              </label>

              <label className="text-sm font-semibold dark:text-white">
                Bio corta
                <input
                  className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                  value={(profile as any).bioShort}
                  onChange={e => setProfile({ ...(profile as any), bioShort: e.target.value })}
                />
              </label>

              <label className="text-sm font-semibold dark:text-white">
                Bio larga
                <textarea
                  className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 min-h-[140px]"
                  value={(profile as any).bioLong}
                  onChange={e => setProfile({ ...(profile as any), bioLong: e.target.value })}
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm font-semibold dark:text-white">
                  WhatsApp
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                    value={(profile as any).whatsapp}
                    onChange={e => setProfile({ ...(profile as any), whatsapp: e.target.value })}
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Email
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                    value={(profile as any).email}
                    onChange={e => setProfile({ ...(profile as any), email: e.target.value })}
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Instagram
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                    value={(profile as any).instagram}
                    onChange={e => setProfile({ ...(profile as any), instagram: e.target.value })}
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Facebook
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                    value={(profile as any).facebook}
                    onChange={e => setProfile({ ...(profile as any), facebook: e.target.value })}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===================== MODAL: Crear / Editar Propiedad ===================== */}
      {isEditing && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-3xl shadow-2xl border dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b dark:border-gray-800 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-lg md:text-xl font-extrabold dark:text-white truncate">
                  {currentProp?.id ? 'Editar Propiedad' : 'Nueva Propiedad'}
                </h3>
                <p className="text-xs text-gray-500">
                  Imágenes: {currentProp.images?.length || 0} · Se guardan en D1
                </p>
              </div>
              <button
                onClick={closePropertyModal}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto p-6">
              {formError && (
                <div className="mb-4 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl p-3">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm font-semibold dark:text-white">
                  Título
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={currentProp.title}
                    onChange={e => setCurrentProp(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ej. Casa en Santa Fe"
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Ciudad
                  <select
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={currentProp.city}
                    onChange={e => setCurrentProp(prev => ({ ...prev, city: e.target.value as City }))}
                  >
                    {CITIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Zona
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={currentProp.zone}
                    onChange={e => setCurrentProp(prev => ({ ...prev, zone: e.target.value }))}
                    placeholder="Ej. Santa Fe"
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Precio
                  <input
                    type="number"
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={currentProp.price}
                    onChange={e => setCurrentProp(prev => ({ ...prev, price: toNum(e.target.value) }))}
                    min={0}
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Moneda
                  <select
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={currentProp.currency}
                    onChange={e =>
                      setCurrentProp(prev => ({ ...prev, currency: e.target.value as 'MXN' | 'USD' }))
                    }
                  >
                    <option value="MXN">MXN</option>
                    <option value="USD">USD</option>
                  </select>
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Avalúo (opcional)
                  <input
                    type="number"
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={currentProp.valuation ?? ''}
                    onChange={e =>
                      setCurrentProp(prev => ({
                        ...prev,
                        valuation: e.target.value === '' ? undefined : toNum(e.target.value)
                      }))
                    }
                    min={0}
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Tipo
                  <select
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={currentProp.type}
                    onChange={e => setCurrentProp(prev => ({ ...prev, type: e.target.value as PropertyType }))}
                  >
                    {TYPES.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Estatus
                  <select
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={currentProp.status}
                    onChange={e =>
                      setCurrentProp(prev => ({ ...prev, status: e.target.value as PropertyStatus }))
                    }
                  >
                    {STATUS.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Recámaras (opcional)
                  <input
                    type="number"
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={currentProp.bedrooms}
                    onChange={e => setCurrentProp(prev => ({ ...prev, bedrooms: toInt(e.target.value) }))}
                    min={0}
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Baños (opcional)
                  <input
                    type="number"
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={currentProp.bathrooms}
                    onChange={e => setCurrentProp(prev => ({ ...prev, bathrooms: toInt(e.target.value) }))}
                    min={0}
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Estacionamientos (opcional)
                  <input
                    type="number"
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={currentProp.parking}
                    onChange={e => setCurrentProp(prev => ({ ...prev, parking: toInt(e.target.value) }))}
                    min={0}
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white md:col-span-2">
                  Descripción
                  <textarea
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950 min-h-[140px]"
                    value={currentProp.description}
                    onChange={e => setCurrentProp(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe la propiedad..."
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white md:col-span-2">
                  Amenidades (separadas por coma)
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={amenitiesText}
                    onChange={e => setAmenitiesText(e.target.value)}
                    placeholder="Alberca, Patio, Seguridad..."
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white md:col-span-2">
                  Video URL (opcional)
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={currentProp.videoUrl || ''}
                    onChange={e => setCurrentProp(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white md:col-span-2">
                  Maps Link (opcional)
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={currentProp.mapsLink || ''}
                    onChange={e => setCurrentProp(prev => ({ ...prev, mapsLink: e.target.value }))}
                    placeholder="https://maps.google.com/..."
                  />
                </label>
              </div>

              <div className="mt-6 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-3xl p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="font-extrabold dark:text-white">Imágenes</div>
                    <div className="text-xs text-gray-500">
                      Puedes subir archivos (se guardan como base64 en D1) o pegar URLs.
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#800020] text-white font-bold cursor-pointer hover:bg-[#600018]">
                    <Plus size={18} /> Subir
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => handleUploadFiles(e.target.files)}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(currentProp.images || []).map((img, idx) => (
                    <div
                      key={`${idx}-${img?.slice?.(0, 20) || 'img'}`}
                      className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
                    >
                      <img src={img} alt="" className="w-full h-28 object-cover" />
                      <button
                        onClick={() => removeImageAt(idx)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white hover:bg-black"
                        title="Quitar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-col md:flex-row gap-3">
                  <textarea
                    className="flex-1 p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950 min-h-[96px]"
                    value={imagesText}
                    onChange={e => setImagesText(e.target.value)}
                    placeholder="Pega URLs aquí (separadas por coma o por líneas)..."
                  />
                  <button
                    type="button"
                    onClick={addImagesFromText}
                    className="md:w-44 px-5 py-3 rounded-xl font-bold bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-black"
                  >
                    Agregar URLs
                  </button>
                </div>

                <label className="mt-4 inline-flex items-center gap-2 text-sm font-semibold dark:text-white">
                  <input
                    type="checkbox"
                    checked={Boolean(currentProp.isPublished)}
                    onChange={e => setCurrentProp(prev => ({ ...prev, isPublished: e.target.checked }))}
                  />
                  Publicada
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t dark:border-gray-800 flex items-center justify-end gap-3">
              <button
                onClick={closePropertyModal}
                className="px-5 py-3 rounded-xl font-bold bg-gray-100 dark:bg-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={saveProperty}
                disabled={savingProp}
                className="px-6 py-3 rounded-xl font-extrabold bg-[#800020] text-white hover:bg-[#600018] disabled:opacity-60"
              >
                {savingProp ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL CONFIRM DELETE ===================== */}
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