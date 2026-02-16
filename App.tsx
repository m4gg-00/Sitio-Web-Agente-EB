
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import AboutMe from './pages/AboutMe';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import AdminLogin from './pages/Admin/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import { MessageCircle } from 'lucide-react';
import { CONTACT_INFO } from './constants';
import { apiService } from './services/apiService';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const p = await apiService.getProfile();
        setProfile(p);
      } catch (err) {
        console.error("Error al cargar perfil inicial.");
      }
    };
    load();
  }, []);

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {!isAdminPath && <Navbar />}
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/propiedades" element={<Properties />} />
          <Route path="/propiedades/:id" element={<PropertyDetail />} />
          <Route path="/sobre-mi" element={<AboutMe />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/privacidad" element={<Privacy />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isAdminPath && <Footer />}

      {!isAdminPath && (
        <a
          href={`https://wa.me/${(profile?.whatsapp || CONTACT_INFO.whatsapp).replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95 flex items-center justify-center"
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle size={28} />
        </a>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
