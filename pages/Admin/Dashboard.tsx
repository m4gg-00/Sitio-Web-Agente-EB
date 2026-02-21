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
  X,
  Phone,
  MessageCircle,
  UploadCloud
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { City, Lead, Property, PropertyStatus, PropertyType, SiteContent } from '../../types';

type Tab = 'properties' | 'profile' | 'leads' | 'reviews';
type ConfirmDelete = null | { type: 'property' | 'lead' | 'review'; id: string };

const CITIES: City[] = ['Tijuana', 'Rosarito'];
const TYPES: PropertyType[] = ['Casa', 'Departamento', 'Terreno', 'Local'];
const STATUS: PropertyStatus[] = ['Disponible', 'Apartada', 'Vendida'];

// Leads
type LeadStatus = 'nuevo' | 'contactado' | 'en seguimiento' | 'cerrado';
const LEAD_STATUS: { value: LeadStatus; label: string }[] = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'en seguimiento', label: 'En seguimiento' },
  { value: 'cerrado', label: 'Cerrado' }
];

const leadStatusBadge = (s?: string) => {
  const status = (s || 'nuevo') as LeadStatus;
  const base = 'text-[10px] px-2 py-1 rounded-full font-extrabold uppercase tracking-wider';
  if (status === 'cerrado') return `${base} bg-gray-200 text-gray-800`;
  if (status === 'en seguimiento') return `${base} bg-amber-100 text-amber-800`;
  if (status === 'contactado') return `${base} bg-blue-100 text-blue-800`;
  return `${base} bg-[#800020]/10 text-[#800020]`;
};

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

const LS_LEAD_STATUS_MAP = 'lead_status_map_v1';

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
  const [imagesText, setImagesText] = useState('');
  const [formError, setFormError] = useState<string>('');

  // Perfil
  const [profileMsg, setProfileMsg] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingProfilePic, setSavingProfilePic] = useState(false);

  // Leads UI
  const [leadQuery, setLeadQuery] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<'todos' | LeadStatus>('todos');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');

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

  const readLeadStatusMap = (): Record<string, LeadStatus> => {
    try {
      const raw = localStorage.getItem(LS_LEAD_STATUS_MAP);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};
      return parsed;
    } catch {
      return {};
    }
  };

  const writeLeadStatusMap = (map: Record<string, LeadStatus>) => {
    try {
      localStorage.setItem(LS_LEAD_STATUS_MAP, JSON.stringify(map));
    } catch {
      // ignore
    }
  };

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

      if (l.status === 'fulfilled') {
        const map = readLeadStatusMap();
        const merged = (l.value || []).map((lead: any) => {
          const localStatus = map[lead.id];
          return localStatus ? { ...lead, status: localStatus } : lead;
        });

        setLeads(merged);

        // autoselección
        const first = merged?.[0]?.id;
        setSelectedLeadId(prev => prev || first || '');
      }

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

        // limpia selección si borraste el seleccionado
        setSelectedLeadId(prev => (prev === confirmDelete.id ? '' : prev));
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

  // ====== PROPIEDADES (NO TOCAR) ======
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
      const uploads = await Promise.all(Array.from(files).map(f => apiService.uploadImage(f)));
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

    const normalized: Property = {
      ...draft,
      title: ((draft as any).title || '').trim(),
      zone: ((draft as any).zone || '').trim(),
      description: ((draft as any).description || '').trim(),
      price: toNum((draft as any).price),
      currency: ((draft as any).currency as any) === 'USD' ? 'USD' : 'MXN',
      valuation:
        (draft as any).valuation === undefined ||
          (draft as any).valuation === null ||
          String((draft as any).valuation).trim() === ''
          ? undefined
          : toNum((draft as any).valuation),
      type: (TYPES.includes((draft as any).type) ? (draft as any).type : 'Casa') as PropertyType,
      status: (STATUS.includes((draft as any).status) ? (draft as any).status : 'Disponible') as PropertyStatus,
      bedrooms: clamp(toInt((draft as any).bedrooms), 0, 99),
      bathrooms: clamp(toInt((draft as any).bathrooms), 0, 99),
      parking: clamp(toInt((draft as any).parking), 0, 99),
      amenities,
      images,
      videoUrl: ((draft as any).videoUrl || '').trim(),
      mapsLink: ((draft as any).mapsLink || '').trim(),
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

      if (!normalized.title) {
        setFormError('El título es obligatorio.');
        setSavingProp(false);
        return;
      }
      if (!normalized.zone) {
        setFormError('La zona es obligatoria.');
        setSavingProp(false);
        return;
      }
      if (!normalized.description) {
        setFormError('La descripción es obligatoria.');
        setSavingProp(false);
        return;
      }
      if (!normalized.images || normalized.images.length === 0) {
        setFormError('Agrega al menos 1 imagen (archivo o URL).');
        setSavingProp(false);
        return;
      }

      await apiService.saveProperty(normalized);
      await refreshData();
      setIsEditing(false);
    } catch (e: any) {
      console.error(e);
      setFormError(
        e?.message ? `Error al guardar: ${e.message}` : 'Error al guardar. Revisa la consola y vuelve a intentar.'
      );
    } finally {
      setSavingProp(false);
    }
  };

  // ====== PERFIL ======
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

  const handleProfilePicUpload = async (file: File | null) => {
    if (!file || !profile) return;
    setSavingProfilePic(true);
    setProfileMsg('');
    try {
      const dataUrl = await apiService.uploadImage(file);
      setProfile(prev => (prev ? { ...prev, profilePic: dataUrl } : prev));
      setProfileMsg('Foto cargada ✅ (no olvides Guardar)');
    } catch (e) {
      console.error(e);
      setProfileMsg('No se pudo cargar la foto.');
    } finally {
      setSavingProfilePic(false);
      setTimeout(() => setProfileMsg(''), 3500);
    }
  };

  // ====== LEADS ======
  const selectedLead = useMemo(() => leads.find(l => l.id === selectedLeadId) || leads[0], [leads, selectedLeadId]);

  const filteredLeads = useMemo(() => {
    const q = leadQuery.trim().toLowerCase();
    return (leads || [])
      .filter(l => {
        if (leadStatusFilter === 'todos') return true;
        return ((l as any).status || 'nuevo') === leadStatusFilter;
      })
      .filter(l => {
        if (!q) return true;
        const hay = [
          (l as any).name,
          (l as any).phone,
          (l as any).message,
          (l as any).cityInterest,
          (l as any).operationType
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a: any, b: any) => {
        const da = new Date((a as any).createdAt || 0).getTime();
        const db = new Date((b as any).createdAt || 0).getTime();
        return db - da;
      });
  }, [leads, leadQuery, leadStatusFilter]);

  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    // 1) UI inmediata
    setLeads(prev => prev.map(l => (l.id === leadId ? ({ ...l, status } as any) : l)));

    // 2) Persistencia local
    const map = readLeadStatusMap();
    map[leadId] = status;
    writeLeadStatusMap(map);

    // 3) Si existe endpoint en apiService, intenta persistir
    try {
      const anyApi: any = apiService as any;
      if (typeof anyApi.updateLeadStatus === 'function') {
        await anyApi.updateLeadStatus(leadId, status);
      } else if (typeof anyApi.saveLead === 'function') {
        // fallback si tu API usa saveLead
        await anyApi.saveLead({ id: leadId, status });
      }
    } catch (e) {
      console.warn('No se pudo persistir estatus en backend; quedó guardado localmente.', e);
    }
  };

  const formatBudget = (l?: any) => {
    if (!l) return '—';
    const amount = l.budgetAmount;
    const cur = l.budgetCurrency || 'MXN';
    if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) {
      try {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: cur }).format(amount);
      } catch {
        return `${amount} ${cur}`;
      }
    }
    if (l.budget && String(l.budget).trim()) return String(l.budget);
    return '—';
  };

  const propertyCountLabel = useMemo(() => {
    const total = properties.length;
    const published = properties.filter(p => (p as any).isPublished).length;
    return `${published}/${total} publicadas`;
  }, [properties]);

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
        <div onClick={() => setIsMobileSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-[45] lg:hidden" />
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
            <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-500/10">
              <LogOut size={20} /> <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="lg:hidden mb-4 flex justify-between items-center">
          <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 bg-[#111827] text-white rounded-lg">
            <Menu size={24} />
          </button>
          <button onClick={refreshData} className="p-2 bg-gray-200 dark:bg-gray-800 rounded-lg dark:text-white">
            <RefreshCw size={20} />
          </button>
        </div>

        {/* =================== PROPIEDADES (NO SE MODIFICA EL AVANCE) =================== */}
        {activeTab === 'properties' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold dark:text-white uppercase tracking-tight">Propiedades</h2>
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
              {properties.map(p => (
                <div key={p.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl flex items-center justify-between border dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={(p as any).images?.[0] || ''}
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                      alt=""
                    />
                    <div className="min-w-0">
                      <div className="font-bold dark:text-white truncate">{(p as any).title}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {(p as any).city} · {(p as any).zone} · {(p as any).isPublished ? 'Publicada' : 'Oculta'}
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

        {/* =================== RESEÑAS =================== */}
        {activeTab === 'reviews' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold dark:text-white uppercase tracking-tighter">Moderación de Reseñas (KV)</h2>
              <button onClick={refreshData} className="text-[#800020] dark:text-[#ff3b5c] font-bold text-sm flex items-center gap-2">
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
                            className={i < (t.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">{t.createdAt ? new Date(t.createdAt).toLocaleString() : ''}</div>
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
                <p className="text-center text-gray-500 py-20 border-2 border-dashed rounded-3xl">No hay reseñas registradas en KV.</p>
              )}
            </div>
          </div>
        )}

        {/* =================== LEADS (DISEÑO DEMO + ESTATUS + FILTRO + PRESUPUESTO) =================== */}
        {activeTab === 'leads' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold dark:text-white">Interesados</h2>
              <button onClick={refreshData} className="text-[#800020] dark:text-[#ff3b5c] font-bold text-sm flex items-center gap-2">
                <RefreshCw size={16} /> Actualizar
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lista */}
              <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-3xl p-4 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                  <input
                    value={leadQuery}
                    onChange={e => setLeadQuery(e.target.value)}
                    placeholder="Buscar lead (nombre, tel, mensaje...)"
                    className="flex-1 px-4 py-3 rounded-2xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />

                  <select
                    value={leadStatusFilter}
                    onChange={e => setLeadStatusFilter(e.target.value as any)}
                    className="md:w-56 px-4 py-3 rounded-2xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white font-semibold"
                  >
                    <option value="todos">Estatus: Todos</option>
                    {LEAD_STATUS.map(s => (
                      <option key={s.value} value={s.value}>
                        Estatus: {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {filteredLeads.map((l: any) => {
                    const isActive = l.id === (selectedLead?.id || '');
                    return (
                      <button
                        key={l.id}
                        onClick={() => setSelectedLeadId(l.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all ${isActive
                            ? 'border-[#800020] bg-[#800020]/5'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-extrabold dark:text-white truncate">{l.name || 'Sin nombre'}</div>
                            <div className="text-sm text-gray-500 truncate">{l.phone || '—'}</div>
                            <div className="text-xs text-gray-400 mt-1">{l.createdAt ? new Date(l.createdAt).toLocaleString() : ''}</div>
                          </div>
                          <span className={leadStatusBadge(l.status)}>{(l.status || 'nuevo').toString()}</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-3 line-clamp-2">{l.message || '—'}</div>
                      </button>
                    );
                  })}

                  {filteredLeads.length === 0 && (
                    <div className="text-center text-gray-500 py-14 border-2 border-dashed rounded-3xl">
                      No hay leads con ese filtro/búsqueda.
                    </div>
                  )}
                </div>
              </div>

              {/* Detalle */}
              <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-3xl p-6 shadow-sm">
                {!selectedLead ? (
                  <div className="text-center text-gray-500 py-20 border-2 border-dashed rounded-3xl">
                    Selecciona un lead para ver el detalle.
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="min-w-0">
                        <div className="text-2xl font-extrabold dark:text-white truncate">{(selectedLead as any).name || 'Sin nombre'}</div>
                        <div className="text-sm text-gray-500">{(selectedLead as any).phone || '—'}</div>
                        <div className="text-xs text-gray-400 mt-1">{(selectedLead as any).createdAt ? new Date((selectedLead as any).createdAt).toLocaleString() : ''}</div>
                      </div>

                      <button
                        onClick={() => setConfirmDelete({ type: 'lead', id: (selectedLead as any).id })}
                        className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Eliminar lead"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-6">
                      <a
                        href={`https://wa.me/52${String((selectedLead as any).phone || '').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-100 text-green-800 font-bold hover:bg-green-200"
                      >
                        <MessageCircle size={18} /> WhatsApp
                      </a>

                      <a
                        href={`tel:${(selectedLead as any).phone || ''}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 dark:bg-white/10 dark:text-white"
                      >
                        <Phone size={18} /> Llamar
                      </a>
                    </div>

                    <div className="mb-5">
                      <div className="text-sm font-extrabold dark:text-white mb-2">Estatus de seguimiento</div>
                      <select
                        value={(((selectedLead as any).status || 'nuevo') as LeadStatus)}
                        onChange={e => updateLeadStatus((selectedLead as any).id, e.target.value as LeadStatus)}
                        className="w-full px-4 py-3 rounded-2xl border dark:border-gray-700 dark:bg-gray-900 dark:text-white font-semibold"
                      >
                        {LEAD_STATUS.map(s => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <div className="text-[11px] text-gray-400 mt-2">
                        * El estatus se guarda en este navegador. Si tu backend tiene endpoint, también se intentará guardar.
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-3xl p-5 mb-5">
                      <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-2">Mensaje</div>
                      <div className="text-gray-800 dark:text-white">{(selectedLead as any).message || '—'}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-3xl p-5 dark:border-gray-700">
                        <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-2">Ciudad interés</div>
                        <div className="font-extrabold dark:text-white">{(selectedLead as any).cityInterest || '—'}</div>
                      </div>

                      <div className="border rounded-3xl p-5 dark:border-gray-700">
                        <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-2">Tipo de operación</div>
                        <div className="font-extrabold dark:text-white">{(selectedLead as any).operationType || '—'}</div>
                      </div>

                      <div className="border rounded-3xl p-5 dark:border-gray-700 md:col-span-2">
                        <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-2">Presupuesto</div>
                        <div className="font-extrabold dark:text-white">{formatBudget(selectedLead as any)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================== PERFIL (SUBIR FOTO, SIN URL) =================== */}
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

            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-3xl p-6 space-y-5 shadow-sm">
              {/* Foto */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 border dark:border-gray-700 flex items-center justify-center">
                  {profile.profilePic ? (
                    <img src={profile.profilePic} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-gray-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="text-sm font-extrabold dark:text-white">Foto de perfil</div>
                  <div className="text-xs text-gray-500">Sube una imagen (JPG/PNG). Se guarda igual que las imágenes en D1.</div>

                  <div className="flex flex-wrap gap-3 mt-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white font-bold cursor-pointer hover:bg-black dark:bg-white dark:text-black">
                      <UploadCloud size={18} />
                      {savingProfilePic ? 'Cargando...' : 'Subir foto'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleProfilePicUpload(e.target.files?.[0] || null)}
                      />
                    </label>

                    {profile.profilePic && (
                      <button
                        type="button"
                        onClick={() => setProfile(prev => (prev ? { ...prev, profilePic: '' } : prev))}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 font-bold hover:bg-red-100"
                      >
                        <X size={18} /> Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm font-semibold dark:text-white">
                  Nombre a mostrar
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                    value={profile.displayName}
                    onChange={e => setProfile({ ...profile, displayName: e.target.value })}
                  />
                </label>

                {/* Se quitó Foto URL */}
                <div className="hidden md:block" />
              </div>

              <label className="text-sm font-semibold dark:text-white">
                Título hero
                <input
                  className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                  value={profile.heroTitle}
                  onChange={e => setProfile({ ...profile, heroTitle: e.target.value })}
                />
              </label>

              <label className="text-sm font-semibold dark:text-white">
                Subtítulo hero
                <input
                  className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                  value={profile.heroSub}
                  onChange={e => setProfile({ ...profile, heroSub: e.target.value })}
                />
              </label>

              <label className="text-sm font-semibold dark:text-white">
                Bio corta
                <input
                  className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                  value={profile.bioShort}
                  onChange={e => setProfile({ ...profile, bioShort: e.target.value })}
                />
              </label>

              <label className="text-sm font-semibold dark:text-white">
                Bio larga
                <textarea
                  className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 min-h-[140px]"
                  value={profile.bioLong}
                  onChange={e => setProfile({ ...profile, bioLong: e.target.value })}
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm font-semibold dark:text-white">
                  WhatsApp
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                    value={profile.whatsapp}
                    onChange={e => setProfile({ ...profile, whatsapp: e.target.value })}
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Email
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                    value={profile.email}
                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Instagram
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                    value={profile.instagram}
                    onChange={e => setProfile({ ...profile, instagram: e.target.value })}
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Facebook
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                    value={profile.facebook}
                    onChange={e => setProfile({ ...profile, facebook: e.target.value })}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =================== MODAL: Crear / Editar Propiedad (NO MODIFICAR) =================== */}
      {isEditing && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-3xl shadow-2xl border dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b dark:border-gray-800 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-lg md:text-xl font-extrabold dark:text-white truncate">
                  {currentProp?.id ? 'Editar Propiedad' : 'Nueva Propiedad'}
                </h3>
                <p className="text-xs text-gray-500">Imágenes: {currentProp.images?.length || 0} · Se guardan en D1</p>
              </div>
              <button onClick={closePropertyModal} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5" title="Cerrar">
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
                    onChange={e => setCurrentProp(prev => ({ ...prev, currency: e.target.value as 'MXN' | 'USD' }))}
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
                    value={(currentProp as any).valuation ?? ''}
                    onChange={e => setCurrentProp(prev => ({ ...prev, valuation: e.target.value === '' ? undefined : toNum(e.target.value) }))}
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
                    onChange={e => setCurrentProp(prev => ({ ...prev, status: e.target.value as PropertyStatus }))}
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
                    value={(currentProp as any).videoUrl || ''}
                    onChange={e => setCurrentProp(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white md:col-span-2">
                  Maps Link (opcional)
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={(currentProp as any).mapsLink || ''}
                    onChange={e => setCurrentProp(prev => ({ ...prev, mapsLink: e.target.value }))}
                    placeholder="https://maps.google.com/..."
                  />
                </label>
              </div>

              <div className="mt-6 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-3xl p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="font-extrabold dark:text-white">Imágenes</div>
                    <div className="text-xs text-gray-500">Puedes subir archivos (se guardan como base64 en D1) o pegar URLs.</div>
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#800020] text-white font-bold cursor-pointer hover:bg-[#600018]">
                    <Plus size={18} /> Subir
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleUploadFiles(e.target.files)} />
                  </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(currentProp.images || []).map((img, idx) => (
                    <div
                      key={`${idx}-${(img as any)?.slice?.(0, 20) || 'img'}`}
                      className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
                    >
                      <img src={img as any} alt="" className="w-full h-28 object-cover" />
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
                    checked={Boolean((currentProp as any).isPublished)}
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

      {/* =================== MODAL CONFIRM DELETE =================== */}
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
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold">
                Cancelar
              </button>
              <button onClick={confirmDeleteNow} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg">
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