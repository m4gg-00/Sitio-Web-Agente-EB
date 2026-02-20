import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { apiService } from "../../services/apiService";
import {
  City,
  Lead,
  Property,
  PropertyStatus,
  PropertyType,
  SiteContent,
  Testimonial,
} from "../../types";

type Tab = "properties" | "leads" | "reviews" | "profile";
type DeleteTarget =
  | null
  | { type: "property" | "lead" | "review"; id: string };

const safeUUID = () => {
  const c: any = globalThis as any;
  if (c?.crypto?.randomUUID) return c.crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
};

const strOrEmpty = (v: any) => (typeof v === "string" ? v : v == null ? "" : String(v));
const numOrZero = (v: any) => {
  if (v === "" || v === undefined || v === null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const numOrUndef = (v: any) => {
  if (v === "" || v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const normalizePropertyForD1 = (draft: Partial<Property>): Property => {
  const currency = (draft.currency as "MXN" | "USD") || "MXN";
  const city = (draft.city as City) || "Tijuana";
  const type = (draft.type as PropertyType) || "Casa";
  const status = (draft.status as PropertyStatus) || "Disponible";

  return {
    id: strOrEmpty(draft.id) || safeUUID(),
    title: strOrEmpty(draft.title).trim(),
    city,
    zone: strOrEmpty(draft.zone).trim(),
    price: numOrZero(draft.price),
    currency,
    valuation: numOrUndef((draft as any).valuation),
    type,
    status,
    bedrooms: numOrZero(draft.bedrooms),
    bathrooms: numOrZero(draft.bathrooms),
    parking: numOrZero(draft.parking),
    description: strOrEmpty(draft.description).trim(),
    amenities: Array.isArray(draft.amenities) ? draft.amenities.filter(Boolean) : [],
    videoUrl: strOrEmpty(draft.videoUrl).trim() || undefined,
    mapsLink: strOrEmpty(draft.mapsLink).trim() || undefined,
    images: Array.isArray(draft.images) ? draft.images.filter(Boolean) : [],
    createdAt: strOrEmpty(draft.createdAt) || new Date().toISOString(),
    isPublished: draft.isPublished ?? true,
  };
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("properties");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [profile, setProfile] = useState<SiteContent | null>(null);
  const [profileMsg, setProfileMsg] = useState("");

  const [confirmDelete, setConfirmDelete] = useState<DeleteTarget>(null);

  // Modal Propiedad
  const [isEditing, setIsEditing] = useState(false);
  const [currentProp, setCurrentProp] = useState<Partial<Property>>({
    images: [],
    amenities: [],
    isPublished: true,
    currency: "MXN",
    city: "Tijuana",
    type: "Casa",
    status: "Disponible",
  });

  // Helpers UI del modal
  const amenitiesText = useMemo(
    () => (Array.isArray(currentProp.amenities) ? currentProp.amenities.join(", ") : ""),
    [currentProp.amenities]
  );

  const imagesText = useMemo(() => {
    const imgs = Array.isArray(currentProp.images) ? currentProp.images : [];
    // Para que sea fácil editar/pegar
    return imgs.join("\n");
  }, [currentProp.images]);

  useEffect(() => {
    const init = async () => {
      const isAuth = await apiService.checkAuth();
      if (!isAuth) {
        navigate("/admin/login");
        return;
      }
      await refreshData();
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
        apiService.getTestimonials(true),
      ]);

      if (p.status === "fulfilled") setProperties(p.value);
      if (l.status === "fulfilled") setLeads(l.value);
      if (prof.status === "fulfilled") setProfile(prof.value);
      if (tests.status === "fulfilled") setTestimonials(pickTestimonials(tests.value));
    } catch (err) {
      console.error("Error al cargar datos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const pickTestimonials = (t: any): Testimonial[] => {
    if (!Array.isArray(t)) return [];
    return t as Testimonial[];
  };

  const handleLogout = async () => {
    await apiService.logout();
    navigate("/");
  };

  const handleApproveReview = async (id: string) => {
    try {
      await apiService.approveTestimonial(id);
      setTestimonials((prev) => prev.map((t) => (t.id === id ? { ...t, approved: true } : t)));
    } catch {
      alert("Error al aprobar.");
    }
  };

  const confirmDeleteNow = async () => {
    if (!confirmDelete) return;

    try {
      if (confirmDelete.type === "property") {
        await apiService.deleteProperty(confirmDelete.id);
        setProperties((prev) => prev.filter((p) => p.id !== confirmDelete.id));
      } else if (confirmDelete.type === "lead") {
        await apiService.deleteLead(confirmDelete.id);
        setLeads((prev) => prev.filter((l) => l.id !== confirmDelete.id));
      } else if (confirmDelete.type === "review") {
        await apiService.deleteTestimonial(confirmDelete.id);
        // reflejo inmediato (si tu API hace borrado lógico/real, esto sigue bien)
        setTestimonials((prev) => prev.filter((t) => t.id !== confirmDelete.id));
      }
    } catch {
      alert("Error al eliminar.");
    } finally {
      setConfirmDelete(null);
    }
  };

  const openNewProperty = () => {
    setCurrentProp({
      id: "",
      title: "",
      city: "Tijuana",
      zone: "",
      price: 0,
      currency: "MXN",
      valuation: undefined,
      type: "Casa",
      status: "Disponible",
      bedrooms: 0,
      bathrooms: 0,
      parking: 0,
      description: "",
      amenities: [],
      videoUrl: "",
      mapsLink: "",
      images: [],
      isPublished: true,
    });
    setIsEditing(true);
  };

  const openEditProperty = (p: Property) => {
    setCurrentProp({
      ...p,
      // asegurar arrays
      amenities: Array.isArray(p.amenities) ? p.amenities : [],
      images: Array.isArray(p.images) ? p.images : [],
      isPublished: p.isPublished ?? true,
    });
    setIsEditing(true);
  };

  const closeModal = () => {
    setIsEditing(false);
  };

  const setPropField = <K extends keyof Property>(key: K, value: any) => {
    setCurrentProp((prev) => ({ ...prev, [key]: value }));
  };

  const handleAmenitiesText = (text: string) => {
    const arr = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setPropField("amenities", arr);
  };

  const handleImagesText = (text: string) => {
    const arr = text
      .split(/\n|,/g)
      .map((s) => s.trim())
      .filter(Boolean);
    setPropField("images", arr);
  };

  const handleAddImagesFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      const encoded = await Promise.all(Array.from(files).map((f) => apiService.uploadImage(f)));
      setCurrentProp((prev) => {
        const existing = Array.isArray(prev.images) ? prev.images : [];
        return { ...prev, images: [...existing, ...encoded] };
      });
    } catch (err) {
      console.error(err);
      alert("No se pudieron cargar las imágenes.");
    }
  };

  const removeImageAt = (idx: number) => {
    setCurrentProp((prev) => {
      const imgs = Array.isArray(prev.images) ? [...prev.images] : [];
      imgs.splice(idx, 1);
      return { ...prev, images: imgs };
    });
  };

  const handleSaveProperty = async () => {
    try {
      const normalized = normalizePropertyForD1(currentProp);

      if (!normalized.title) {
        alert("Falta el título.");
        return;
      }
      if (!normalized.zone) {
        alert("Falta la zona.");
        return;
      }
      if (!normalized.description) {
        alert("Falta la descripción.");
        return;
      }

      await apiService.saveProperty(normalized);

      // actualizar lista local (sin depender del refresh completo)
      setProperties((prev) => {
        const exists = prev.some((p) => p.id === normalized.id);
        if (exists) return prev.map((p) => (p.id === normalized.id ? normalized : p));
        return [normalized, ...prev];
      });

      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Error al guardar.");
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    try {
      await apiService.saveProfile(profile);
      setProfileMsg("✅ Perfil guardado correctamente.");
      setTimeout(() => setProfileMsg(""), 2500);
    } catch (err: any) {
      console.error(err);
      setProfileMsg(err?.message || "Error al guardar perfil.");
      setTimeout(() => setProfileMsg(""), 3500);
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
      {/* overlay móvil */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-[45] lg:hidden"
        />
      )}

      {/* sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-[#111827] text-white z-50 transform transition-transform ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
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
                setActiveTab("properties");
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === "properties" ? "bg-[#800020]" : "hover:bg-white/5"
                }`}
            >
              <LayoutDashboard size={20} />
              <span className="font-semibold">Propiedades</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("leads");
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === "leads" ? "bg-[#800020]" : "hover:bg-white/5"
                }`}
            >
              <MessageSquare size={20} />
              <span className="font-semibold">Leads</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("reviews");
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === "reviews" ? "bg-[#800020]" : "hover:bg-white/5"
                }`}
            >
              <Star size={20} />
              <span className="font-semibold">Reseñas</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("profile");
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === "profile" ? "bg-[#800020]" : "hover:bg-white/5"
                }`}
            >
              <User size={20} />
              <span className="font-semibold">Perfil</span>
            </button>
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-500/10"
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* main */}
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
            title="Actualizar"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* PROPIEDADES */}
        {activeTab === "properties" && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold dark:text-white uppercase tracking-tight">
                Propiedades
              </h2>
              <button
                onClick={openNewProperty}
                className="bg-[#800020] text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-[#600018] flex items-center gap-2"
              >
                <Plus size={18} /> Nueva Propiedad
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {properties.map((p) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-2xl flex items-center justify-between border dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={p.images?.[0] || "https://picsum.photos/seed/eb/120/120"}
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                    />
                    <div>
                      <div className="font-bold dark:text-white">{p.title}</div>
                      <div className="text-xs text-gray-500">
                        {p.city} · {p.zone}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditProperty(p)}
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ type: "property", id: p.id })}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              {properties.length === 0 && (
                <p className="text-center text-gray-500 py-20 border-2 border-dashed rounded-3xl">
                  No hay propiedades registradas.
                </p>
              )}
            </div>
          </div>
        )}

        {/* LEADS */}
        {activeTab === "leads" && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold dark:text-white">Interesados</h2>
              <button
                onClick={refreshData}
                className="text-[#800020] dark:text-[#ff3b5c] font-bold text-sm flex items-center gap-2"
              >
                <RefreshCw size={16} /> Actualizar
              </button>
            </div>

            <div className="space-y-4">
              {leads.map((l) => (
                <div
                  key={l.id}
                  className="bg-white dark:bg-gray-800 p-5 rounded-2xl border dark:border-gray-700 flex justify-between items-center shadow-sm"
                >
                  <div>
                    <div className="font-bold dark:text-white">{l.name}</div>
                    <div className="text-sm text-gray-500">{l.phone}</div>
                    {l.email && <div className="text-xs text-gray-400">{l.email}</div>}
                  </div>

                  <button
                    onClick={() => setConfirmDelete({ type: "lead", id: l.id })}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {leads.length === 0 && (
                <p className="text-center text-gray-500 py-20 border-2 border-dashed rounded-3xl">
                  No hay leads registrados.
                </p>
              )}
            </div>
          </div>
        )}

        {/* RESEÑAS */}
        {activeTab === "reviews" && (
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
                  className={`p-6 rounded-3xl border shadow-sm transition-all ${t.approved
                      ? "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                      : "bg-[#800020]/5 dark:bg-[#800020]/10 border-[#800020]/20"
                    }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-bold text-lg dark:text-white flex items-center gap-2">
                        {t.name}
                      </div>
                      <div className="flex gap-1 py-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < (t.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                          />
                        ))}
                      </div>
                      {t.createdAt && (
                        <div className="text-[10px] text-gray-400 font-mono">
                          {new Date(t.createdAt).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {!t.approved && (
                      <span className="bg-[#800020] text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse">
                        Pendiente
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 italic mb-6">"{t.text}"</p>

                  <div className="flex justify-end gap-3 border-t dark:border-gray-700 pt-4">
                    {!t.approved && (
                      <button
                        onClick={() => handleApproveReview(t.id)}
                        className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl hover:bg-green-100 transition-colors"
                      >
                        <CheckCircle size={18} /> Aprobar
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDelete({ type: "review", id: t.id })}
                      className="flex items-center gap-2 text-red-600 font-bold text-sm bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={18} /> Eliminar
                    </button>
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

        {/* PERFIL */}
        {activeTab === "profile" && (
          <div className="max-w-3xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold dark:text-white">Perfil</h2>
              <button
                onClick={handleSaveProfile}
                className="bg-[#800020] text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-[#600018]"
              >
                Guardar
              </button>
            </div>

            {profileMsg && (
              <div className="mb-4 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 dark:text-white border dark:border-gray-700">
                {profileMsg}
              </div>
            )}

            {!profile ? (
              <div className="text-gray-500">Cargando perfil...</div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border dark:border-gray-700 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Nombre a mostrar"
                    value={profile.displayName}
                    onChange={(v) => setProfile({ ...profile, displayName: v })}
                  />
                  <Field
                    label="WhatsApp"
                    value={profile.whatsapp}
                    onChange={(v) => setProfile({ ...profile, whatsapp: v })}
                  />
                  <Field
                    label="Email"
                    value={profile.email}
                    onChange={(v) => setProfile({ ...profile, email: v })}
                  />
                  <Field
                    label="Instagram"
                    value={profile.instagram}
                    onChange={(v) => setProfile({ ...profile, instagram: v })}
                  />
                  <Field
                    label="Facebook"
                    value={profile.facebook}
                    onChange={(v) => setProfile({ ...profile, facebook: v })}
                  />
                  <Field
                    label="Foto (URL)"
                    value={profile.profilePic}
                    onChange={(v) => setProfile({ ...profile, profilePic: v })}
                  />
                </div>

                <Field
                  label="Hero Title"
                  value={profile.heroTitle}
                  onChange={(v) => setProfile({ ...profile, heroTitle: v })}
                />
                <Field
                  label="Hero Sub"
                  value={profile.heroSub}
                  onChange={(v) => setProfile({ ...profile, heroSub: v })}
                />

                <TextArea
                  label="Bio corta"
                  value={profile.bioShort}
                  onChange={(v) => setProfile({ ...profile, bioShort: v })}
                />
                <TextArea
                  label="Bio larga"
                  value={profile.bioLong}
                  onChange={(v) => setProfile({ ...profile, bioLong: v })}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL CREAR/EDITAR PROPIEDAD */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 my-8">
            <div className="flex items-center justify-between p-6 border-b dark:border-white/10">
              <div>
                <h3 className="text-xl font-bold dark:text-white">
                  {currentProp.id ? "Editar Propiedad" : "Nueva Propiedad"}
                </h3>
                <p className="text-xs text-gray-500">
                  Las imágenes se guardan en D1 dentro del campo <span className="font-mono">images</span>.
                </p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10">
                <X size={20} className="dark:text-white" />
              </button>
            </div>

            <div className="p-6 max-h-[78vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Título"
                  value={strOrEmpty(currentProp.title)}
                  onChange={(v) => setPropField("title", v)}
                />
                <div className="space-y-2">
                  <label className="text-sm font-semibold dark:text-white">Ciudad</label>
                  <select
                    className="w-full rounded-xl border p-3 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                    value={(currentProp.city as City) || "Tijuana"}
                    onChange={(e) => setPropField("city", e.target.value as City)}
                  >
                    <option value="Tijuana">Tijuana</option>
                    <option value="Rosarito">Rosarito</option>
                  </select>
                </div>

                <Field
                  label="Zona"
                  value={strOrEmpty(currentProp.zone)}
                  onChange={(v) => setPropField("zone", v)}
                />

                <Field
                  label="Precio"
                  type="number"
                  value={String(currentProp.price ?? 0)}
                  onChange={(v) => setPropField("price", v)}
                />

                <div className="space-y-2">
                  <label className="text-sm font-semibold dark:text-white">Moneda</label>
                  <select
                    className="w-full rounded-xl border p-3 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                    value={(currentProp.currency as "MXN" | "USD") || "MXN"}
                    onChange={(e) => setPropField("currency", e.target.value as "MXN" | "USD")}
                  >
                    <option value="MXN">MXN</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <Field
                  label="Avalúo (opcional)"
                  type="number"
                  value={currentProp.valuation === undefined || currentProp.valuation === null ? "" : String(currentProp.valuation)}
                  onChange={(v) => setPropField("valuation", v)}
                />

                <div className="space-y-2">
                  <label className="text-sm font-semibold dark:text-white">Tipo</label>
                  <select
                    className="w-full rounded-xl border p-3 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                    value={(currentProp.type as PropertyType) || "Casa"}
                    onChange={(e) => setPropField("type", e.target.value as PropertyType)}
                  >
                    <option value="Casa">Casa</option>
                    <option value="Departamento">Departamento</option>
                    <option value="Terreno">Terreno</option>
                    <option value="Local">Local</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold dark:text-white">Estatus</label>
                  <select
                    className="w-full rounded-xl border p-3 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                    value={(currentProp.status as PropertyStatus) || "Disponible"}
                    onChange={(e) => setPropField("status", e.target.value as PropertyStatus)}
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Apartada">Apartada</option>
                    <option value="Vendida">Vendida</option>
                  </select>
                </div>

                <Field
                  label="Recámaras (opcional)"
                  type="number"
                  value={String(currentProp.bedrooms ?? 0)}
                  onChange={(v) => setPropField("bedrooms", v)}
                />
                <Field
                  label="Baños (opcional)"
                  type="number"
                  value={String(currentProp.bathrooms ?? 0)}
                  onChange={(v) => setPropField("bathrooms", v)}
                />
                <Field
                  label="Estacionamientos (opcional)"
                  type="number"
                  value={String(currentProp.parking ?? 0)}
                  onChange={(v) => setPropField("parking", v)}
                />

                <TextArea
                  label="Descripción"
                  value={strOrEmpty(currentProp.description)}
                  onChange={(v) => setPropField("description", v)}
                />

                <Field
                  label="Video URL (opcional)"
                  value={strOrEmpty(currentProp.videoUrl)}
                  onChange={(v) => setPropField("videoUrl", v)}
                />
                <Field
                  label="Maps Link (opcional)"
                  value={strOrEmpty(currentProp.mapsLink)}
                  onChange={(v) => setPropField("mapsLink", v)}
                />

                <TextArea
                  label="Amenidades (separadas por coma)"
                  value={amenitiesText}
                  onChange={handleAmenitiesText}
                  placeholder="Alberca, Patio, Seguridad, ..."
                />

                {/* IMÁGENES */}
                <div className="md:col-span-2 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <label className="text-sm font-semibold dark:text-white">
                      Imágenes (archivos o URLs)
                    </label>

                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 dark:text-white cursor-pointer w-fit">
                      <Plus size={16} />
                      <span className="text-sm font-bold">Agregar archivos</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleAddImagesFiles(e.target.files)}
                      />
                    </label>
                  </div>

                  <TextArea
                    label="Lista de URLs/Base64 (una por línea o separadas por coma)"
                    value={imagesText}
                    onChange={handleImagesText}
                    placeholder={"https://... \nhttps://..."}
                  />

                  {/* previews */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(Array.isArray(currentProp.images) ? currentProp.images : []).map((src, idx) => (
                      <div key={`${idx}_${src.slice(0, 20)}`} className="relative group">
                        <img
                          src={src}
                          className="w-full h-28 object-cover rounded-2xl border dark:border-gray-700 bg-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => removeImageAt(idx)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white rounded-lg p-1"
                          title="Quitar"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      id="published"
                      type="checkbox"
                      checked={Boolean(currentProp.isPublished)}
                      onChange={(e) => setPropField("isPublished", e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="published" className="text-sm font-semibold dark:text-white">
                      Publicada
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t dark:border-white/10 flex flex-col md:flex-row gap-3 md:justify-end">
              <button
                onClick={closeModal}
                className="px-6 py-3 rounded-xl font-bold bg-gray-100 dark:bg-white/10 dark:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProperty}
                className="px-6 py-3 rounded-xl font-bold bg-[#800020] text-white shadow-lg hover:bg-[#600018]"
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
            <p className="text-gray-500 mb-8">Esta acción no se puede deshacer.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold dark:text-white"
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

/** ---------- UI Helpers ---------- */

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold dark:text-white">{props.label}</label>
      <input
        type={props.type || "text"}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded-xl border p-3 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
      />
    </div>
  );
}

function TextArea(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2 md:col-span-2">
      <label className="text-sm font-semibold dark:text-white">{props.label}</label>
      <textarea
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded-xl border p-3 min-h-[110px] bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
      />
    </div>
  );
}