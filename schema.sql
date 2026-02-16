-- Tabla de Propiedades
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  city TEXT NOT NULL,
  zone TEXT,
  price REAL NOT NULL,
  currency TEXT NOT NULL,
  valuation REAL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  bedrooms INTEGER,
  bathrooms REAL,
  parking INTEGER,
  description TEXT,
  amenities TEXT, -- Almacenado como JSON string
  videoUrl TEXT,
  mapsLink TEXT,
  images TEXT,    -- Almacenado como JSON string
  isPublished INTEGER DEFAULT 1,
  createdAt TEXT NOT NULL
);

-- Tabla de Prospectos (Leads)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  cityInterest TEXT,
  operationType TEXT,
  budget TEXT,
  message TEXT,
  status TEXT DEFAULT 'nuevo',
  notes TEXT,
  createdAt TEXT NOT NULL
);

-- Tabla de Testimonios
CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  rating INTEGER NOT NULL,
  approved INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL
);

-- Tabla de Perfil (Fila única)
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  displayName TEXT,
  heroTitle TEXT,
  heroSub TEXT,
  profilePic TEXT,
  bioShort TEXT,
  bioLong TEXT,
  whatsapp TEXT,
  email TEXT,
  instagram TEXT,
  facebook TEXT
);

-- Insertar perfil por defecto
INSERT OR IGNORE INTO profile (id, displayName, heroTitle, heroSub, profilePic, bioShort, bioLong, whatsapp, email, instagram, facebook)
VALUES (1, 'Escarleth Barreras', 'Más que vender propiedades, creo historias y nuevos comienzos', 'Te acompaño con honestidad y transparencia.', 'https://picsum.photos/seed/eb/400/400', 'Asesora inmobiliaria certificada.', 'Trayectoria profesional...', '+526633157034', 'escarlethbarreras24@gmail.com', 'escarlethbarreras222', 'https://facebook.com/escarleth');