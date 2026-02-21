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
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { City, Lead, Property, PropertyStatus, PropertyType, SiteContent } from '../../types';

type Tab = 'properties' | 'profile' | 'leads' | 'reviews';
type ConfirmDelete = null | { type: 'property' | 'lead' | 'review'; id: string };

// LeadStatus (local para evitar errores si no existe en ../../types)
type LeadStatus = 'nuevo' | 'contactado' | 'seguimiento' | 'cerrado';
const LEAD_STATUS: { value: LeadStatus; label: string }[] = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'seguimiento', label: 'En seguimiento' },
  { value: 'cerrado', label: 'Cerrado' },
];

const CITIES: City[] = ['Tijuana', 'Rosarito'];
const TYPES: PropertyType[] = ['Casa', 'Departamento', 'Terreno', 'Local'];
const STATUS: PropertyStatus[] = ['Disponible', 'Apartada', 'Vendida'];

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
  isPublished: true,
});

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
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);

  // Leads UI state
  const [leadQuery, setLeadQuery] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<'all' | LeadStatus>('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

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
        apiService.getTestimonials(true),
      ]);

      if (p.status === 'fulfilled') setProperties(p.value);
      if (l.status === 'fulfilled') {
        setLeads(l.value);
        // auto-select primer lead si no hay seleccionado
        const first = l.value?.[0]?.id;
        setSelectedLeadId(prev => prev ?? (first || null));
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
        setSelectedLeadId(prev => (prev === confirmDelete.id ? null : prev));
      } else if (confirmDelete.type === 'review') {
        await apiService.deleteTestimonial(confirmDelete.id);
        setTestimonials(prev =>
          prev.map(t => (t.id === confirmDelete.id ? { ...t, status: 'deleted', approved: false } : t)),
        );
      }
    } catch {
      alert('Error al eliminar.');
    }
    setConfirmDelete(null);
  };

  // =========================
  // PROPIEDADES (NO TOCAR)
  // =========================
  const openNewProperty = () => {
    const draft = emptyPropertyDraft();
    setCurrentProp(draft);
    setAmenitiesText('');
    setImagesText('');
    setFormError('');
    setIsEditing(true);
  };

  const openEditProperty = (p: Property) => {
    // normaliza para evitar undefined en numéricos
    const normalized: Property = {
      ...p,
      price: toNum(p.price),
      bedrooms: toInt((p as any).bedrooms),
      bathrooms: toInt((p as any).bathrooms),
      parking: toInt((p as any).parking),
      currency: (p as any).currency ?? 'MXN',
      images: Array.isArray((p as any).images) ? (p as any).images : [],
      amenities: Array.isArray((p as any).amenities) ? (p as any).amenities : [],
      isPublished: (p as any).isPublished ?? true,
    };
    setCurrentProp(normalized);
    setAmenitiesText(((normalized as any).amenities || []).join(', '));
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
      images: [...(((prev as any).images || []) as any[]), ...urls],
    }));
    setImagesText('');
  };

  const removeImageAt = (idx: number) => {
    setCurrentProp(prev => ({
      ...prev,
      images: (((prev as any).images || []) as any[]).filter((_: any, i: number) => i !== idx),
    }));
  };

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFormError('');

    try {
      // Guardar base64 (DataURL) directo en D1 dentro del JSON images
      const uploads = await Promise.all(Array.from(files).map(f => apiService.uploadImage(f)));
      setCurrentProp(prev => ({
        ...prev,
        images: [...(((prev as any).images || []) as any[]), ...uploads],
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

    const images = Array.isArray((draft as any).images) ? ((draft as any).images as any[]).filter(Boolean) : [];

    // IMPORTANT: evitar undefined
    const valuationRaw = (draft as any).valuation;
    const valuation =
      valuationRaw === undefined || valuationRaw === null || String(valuationRaw).trim() === ''
        ? undefined
        : toNum(valuationRaw);

    const normalized: Property = {
      ...draft,
      title: ((draft as any).title || '').trim(),
      zone: ((draft as any).zone || '').trim(),
      description: ((draft as any).description || '').trim(),
      price: toNum((draft as any).price),
      currency: (draft as any).currency === 'USD' ? 'USD' : 'MXN',
      valuation,
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
      createdAt: (draft as any).createdAt || new Date().toISOString(),
    };

    return normalized;
  };

  const saveProperty = async () => {
    setSavingProp(true);
    setFormError('');

    try {
      const normalized = normalizePropertyForSave(currentProp);

      // Validaciones mínimas
      if (!((normalized as any).title || '').trim()) {
        setFormError('El título es obligatorio.');
        setSavingProp(false);
        return;
      }
      if (!((normalized as any).zone || '').trim()) {
        setFormError('La zona es obligatoria.');
        setSavingProp(false);
        return;
      }
      if (!((normalized as any).description || '').trim()) {
        setFormError('La descripción es obligatoria.');
        setSavingProp(false);
        return;
      }
      if (!Array.isArray((normalized as any).images) || (normalized as any).images.length === 0) {
        setFormError('Agrega al menos 1 imagen (archivo o URL).');
        setSavingProp(false);
        return;
      }

      await apiService.saveProperty(normalized);
      await refreshData();
      setIsEditing(false);
    } catch (e: any) {
      console.error(e);
      setFormError(e?.message ? `Error al guardar: ${e.message}` : 'Error al guardar. Revisa la consola.');
    } finally {
      setSavingProp(false);
    }
  };

  // =========================
  // LEADS (MEJORADO)
  // =========================
  const normalizeLeadStatus = (l: Lead): LeadStatus => {
    const s = String((l as any).status || 'nuevo').toLowerCase().trim();
    if (s === 'contactado') return 'contactado';
    if (s === 'seguimiento' || s === 'en seguimiento') return 'seguimiento';
    if (s === 'cerrado') return 'cerrado';
    return 'nuevo';
  };

  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    // Optimistic UI
    setLeads(prev => prev.map(l => (l.id === leadId ? ({ ...(l as any), status } as any) : l)));

    try {
      // ✅ Persistir en D1
      await apiService.saveLead({ id: leadId, status } as any);
    } catch (e) {
      console.error(e);
      alert('No se pudo guardar el estatus en el servidor. Revisa tu conexión e inténtalo de nuevo.');
      await refreshData(); // revert
    }
  };

  const filteredLeads = useMemo(() => {
    const q = leadQuery.trim().toLowerCase();
    return leads
      .slice()
      .sort((a: any, b: any) => {
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
        return db - da;
      })
      .filter(l => {
        const status = normalizeLeadStatus(l);
        if (leadStatusFilter !== 'all' && status !== leadStatusFilter) return false;

        if (!q) return true;
        const hay = [
          (l as any).name,
          (l as any).phone,
          (l as any).message,
          (l as any).city,
          (l as any).operationType,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
  }, [leads, leadQuery, leadStatusFilter]);

  const selectedLead: Lead | null = useMemo(() => {
    const pick =
      leads.find(l => l.id === selectedLeadId) ||
      filteredLeads.find(l => l.id === selectedLeadId) ||
      filteredLeads[0] ||
      null;
    return pick || null;
  }, [leads, filteredLeads, selectedLeadId]);

  // =========================
  // PERFIL (UPLOAD FOTO)
  // =========================
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

  const handleUploadProfilePic = async (files: FileList | null) => {
    if (!files || files.length === 0 || !profile) return;
    setUploadingProfilePic(true);
    try {
      const img = await apiService.uploadImage(files[0]);
      setProfile({ ...profile, profilePic: img });
    } catch (e) {
      console.error(e);
      alert('No se pudo subir la foto. Intenta con una imagen más ligera.');
    } finally {
      setUploadingProfilePic(false);
    }
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

        {/* ========================= PROPIEDADES (SE QUEDA COMO YA LO TENÍAS) ========================= */}
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
                <div
                  key={(p as any).id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-2xl flex items-center justify-between border dark:border-gray-700 shadow-sm"
                >
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
                      onClick={() => setConfirmDelete({ type: 'property', id: (p as any).id })}
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

        {/* ========================= LEADS (NUEVO DISEÑO + STATUS PERSISTENTE) ========================= */}
        {activeTab === 'leads' && (
          <div>
            <div className="flex items-center justify-between mb-6">
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
                    value={leadQuery}
                    onChange={e => setLeadQuery(e.target.value)}
                    placeholder="Buscar lead (nombre, tel, mensaje...)"
                    className="flex-1 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <select
                    value={leadStatusFilter}
                    onChange={e => setLeadStatusFilter(e.target.value as any)}
                    className="md:w-56 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white font-semibold"
                  >
                    <option value="all">Estatus: Todos</option>
                    {LEAD_STATUS.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {filteredLeads.map(l => {
                    const status = normalizeLeadStatus(l);
                    const isSelected = l.id === (selectedLead?.id || null);
                    return (
                      <button
                        key={l.id}
                        onClick={() => setSelectedLeadId(l.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all ${isSelected
                            ? 'border-[#800020] bg-[#800020]/5'
                            : 'border-gray-200 dark:border-gray-700 hover:border-[#800020]/40'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-extrabold text-gray-900 dark:text-white truncate">{(l as any).name || 'Sin nombre'}</div>
                            <div className="text-sm text-gray-500 truncate">{(l as any).phone || '—'}</div>
                            <div className="text-[11px] text-gray-400 mt-1">
                              {(l as any).createdAt ? new Date((l as any).createdAt).toLocaleString() : ''}
                            </div>
                          </div>

                          <span
                            className={`text-[10px] px-2 py-1 rounded-full font-extrabold uppercase tracking-wider ${status === 'nuevo'
                                ? 'bg-[#800020] text-white'
                                : status === 'contactado'
                                  ? 'bg-blue-100 text-blue-700'
                                  : status === 'seguimiento'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-green-100 text-green-800'
                              }`}
                          >
                            {LEAD_STATUS.find(s => s.value === status)?.label || 'Nuevo'}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-3 line-clamp-2">
                          {(l as any).message || '—'}
                        </div>
                      </button>
                    );
                  })}

                  {filteredLeads.length === 0 && (
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
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-2xl font-extrabold dark:text-white truncate">{(selectedLead as any).name || 'Sin nombre'}</div>
                        <div className="text-gray-500">{(selectedLead as any).phone || '—'}</div>
                        <div className="text-[12px] text-gray-400 mt-1">
                          {(selectedLead as any).createdAt ? new Date((selectedLead as any).createdAt).toLocaleString() : ''}
                        </div>
                      </div>

                      <button
                        onClick={() => setConfirmDelete({ type: 'lead', id: selectedLead.id })}
                        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-white/5 text-red-500"
                        title="Eliminar lead"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* actions */}
                    <div className="flex flex-wrap gap-3 mt-5">
                      <a
                        className="px-5 py-2 rounded-2xl font-extrabold bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        href={`https://wa.me/${String((selectedLead as any).phone || '').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                      <a
                        className="px-5 py-2 rounded-2xl font-extrabold bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors inline-flex items-center gap-2"
                        href={`tel:${(selectedLead as any).phone || ''}`}
                      >
                        <Phone size={16} /> Llamar
                      </a>
                    </div>

                    {/* status */}
                    <div className="mt-6">
                      <div className="text-sm font-extrabold dark:text-white mb-2">Estatus de seguimiento</div>
                      <select
                        value={normalizeLeadStatus(selectedLead)}
                        onChange={e => updateLeadStatus(selectedLead.id, e.target.value as LeadStatus)}
                        className="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white font-semibold"
                      >
                        {LEAD_STATUS.map(s => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* message */}
                    <div className="mt-6 rounded-3xl border border-gray-200 dark:border-gray-700 p-5">
                      <div className="text-[11px] font-extrabold tracking-wider text-gray-400 uppercase mb-2">
                        Mensaje
                      </div>
                      <div className="text-gray-900 dark:text-white">{(selectedLead as any).message || '—'}</div>
                    </div>

                    {/* meta */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="rounded-3xl border border-gray-200 dark:border-gray-700 p-5">
                        <div className="text-[11px] font-extrabold tracking-wider text-gray-400 uppercase mb-2">
                          Ciudad interés
                        </div>
                        <div className="font-extrabold dark:text-white">{(selectedLead as any).city || '—'}</div>
                      </div>

                      <div className="rounded-3xl border border-gray-200 dark:border-gray-700 p-5">
                        <div className="text-[11px] font-extrabold tracking-wider text-gray-400 uppercase mb-2">
                          Tipo de operación
                        </div>
                        <div className="font-extrabold dark:text-white">{(selectedLead as any).operationType || '—'}</div>
                      </div>

                      <div className="rounded-3xl border border-gray-200 dark:border-gray-700 p-5">
                        <div className="text-[11px] font-extrabold tracking-wider text-gray-400 uppercase mb-2">
                          Presupuesto
                        </div>
                        <div className="font-extrabold dark:text-white">
                          {(() => {
                            const budget = (selectedLead as any).budget;
                            const cur = (selectedLead as any).currency || 'MXN';
                            if (budget === undefined || budget === null || String(budget).trim() === '') return '—';
                            const n = toNum(budget);
                            return `${n.toLocaleString()} ${cur}`;
                          })()}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================= REVIEWS (IGUAL) ========================= */}
        {activeTab === 'reviews' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold dark:text-white uppercase tracking-tighter">Moderación de Reseñas (KV)</h2>
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
                            className={i < (t.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
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
                <p className="text-center text-gray-500 py-20 border-2 border-dashed rounded-3xl">No hay reseñas registradas en KV.</p>
              )}
            </div>
          </div>
        )}

        {/* ========================= PROFILE (UPLOAD FOTO) ========================= */}
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
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 border dark:border-gray-700">
                  {profile.profilePic ? (
                    <img src={profile.profilePic} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sin foto</div>
                  )}
                </div>

                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#800020] text-white font-bold cursor-pointer hover:bg-[#600018]">
                  {uploadingProfilePic ? 'Subiendo...' : 'Subir foto'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleUploadProfilePic(e.target.files)}
                  />
                </label>

                {profile.profilePic && (
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, profilePic: '' })}
                    className="px-4 py-2 rounded-xl font-bold bg-gray-100 dark:bg-gray-900 dark:text-white border dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800"
                  >
                    Quitar
                  </button>
                )}
              </div>

              {/* Campos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm font-semibold dark:text-white">
                  Nombre a mostrar
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900"
                    value={profile.displayName}
                    onChange={e => setProfile({ ...profile, displayName: e.target.value })}
                  />
                </label>

                {/* Quitamos URL Foto */}
                <div className="text-sm font-semibold dark:text-white">
                  Foto (subida)
                  <div className="mt-1 w-full p-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 text-gray-500">
                    Se gestiona con “Subir foto”.
                  </div>
                </div>
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

      {/* ========================= MODAL: PROPIEDAD (SE QUEDA) ========================= */}
      {isEditing && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-3xl shadow-2xl border dark:border-gray-800 overflow-hidden">
            {/* header */}
            <div className="px-6 py-4 border-b dark:border-gray-800 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-lg md:text-xl font-extrabold dark:text-white truncate">
                  {(currentProp as any)?.id ? 'Editar Propiedad' : 'Nueva Propiedad'}
                </h3>
                <p className="text-xs text-gray-500">Imágenes: {(currentProp as any).images?.length || 0} · Se guardan en D1</p>
              </div>
              <button
                onClick={closePropertyModal}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {/* body scroll */}
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
                    value={(currentProp as any).title}
                    onChange={e => setCurrentProp(prev => ({ ...(prev as any), title: e.target.value } as any))}
                    placeholder="Ej. Casa en Santa Fe"
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Ciudad
                  <select
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={(currentProp as any).city}
                    onChange={e => setCurrentProp(prev => ({ ...(prev as any), city: e.target.value as City } as any))}
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
                    value={(currentProp as any).zone}
                    onChange={e => setCurrentProp(prev => ({ ...(prev as any), zone: e.target.value } as any))}
                    placeholder="Ej. Santa Fe"
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Precio
                  <input
                    type="number"
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={(currentProp as any).price}
                    onChange={e => setCurrentProp(prev => ({ ...(prev as any), price: toNum(e.target.value) } as any))}
                    min={0}
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Moneda
                  <select
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={(currentProp as any).currency}
                    onChange={e => setCurrentProp(prev => ({ ...(prev as any), currency: e.target.value as 'MXN' | 'USD' } as any))}
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
                    onChange={e => setCurrentProp(prev => ({ ...(prev as any), valuation: e.target.value === '' ? undefined : toNum(e.target.value) } as any))}
                    min={0}
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Tipo
                  <select
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={(currentProp as any).type}
                    onChange={e => setCurrentProp(prev => ({ ...(prev as any), type: e.target.value as PropertyType } as any))}
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
                    value={(currentProp as any).status}
                    onChange={e => setCurrentProp(prev => ({ ...(prev as any), status: e.target.value as PropertyStatus } as any))}
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
                    value={(currentProp as any).bedrooms}
                    onChange={e => setCurrentProp(prev => ({ ...(prev as any), bedrooms: toInt(e.target.value) } as any))}
                    min={0}
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Baños (opcional)
                  <input
                    type="number"
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={(currentProp as any).bathrooms}
                    onChange={e => setCurrentProp(prev => ({ ...(prev as any), bathrooms: toInt(e.target.value) } as any))}
                    min={0}
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white">
                  Estacionamientos (opcional)
                  <input
                    type="number"
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={(currentProp as any).parking}
                    onChange={e => setCurrentProp(prev => ({ ...(prev as any), parking: toInt(e.target.value) } as any))}
                    min={0}
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white md:col-span-2">
                  Descripción
                  <textarea
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950 min-h-[140px]"
                    value={(currentProp as any).description}
                    onChange={e => setCurrentProp(prev => ({ ...(prev as any), description: e.target.value } as any))}
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
                    onChange={e => setCurrentProp(prev => ({ ...(prev as any), videoUrl: e.target.value } as any))}
                    placeholder="https://..."
                  />
                </label>

                <label className="text-sm font-semibold dark:text-white md:col-span-2">
                  Maps Link (opcional)
                  <input
                    className="mt-1 w-full p-3 rounded-xl border dark:border-gray-800 dark:bg-gray-950"
                    value={(currentProp as any).mapsLink || ''}
                    onChange={e => setCurrentProp(prev => ({ ...(prev as any), mapsLink: e.target.value } as any))}
                    placeholder="https://maps.google.com/..."
                  />
                </label>
              </div>

              {/* IMÁGENES */}
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
                  {(((currentProp as any).images || []) as string[]).map((img, idx) => (
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
                    checked={Boolean((currentProp as any).isPublished)}
                    onChange={e => setCurrentProp(prev => ({ ...(prev as any), isPublished: e.target.checked } as any))}
                  />
                  Publicada
                </label>
              </div>
            </div>

            {/* footer */}
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

      {/* ========================= MODAL CONFIRM DELETE ========================= */}
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