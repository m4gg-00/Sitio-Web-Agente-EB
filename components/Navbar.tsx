
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, Moon, Sun } from 'lucide-react';
import { CONTACT_INFO } from '../constants';
import { toWhatsAppUrl } from '../utils/links';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Sincronizar estado inicial con la clase del HTML (seteada por el script en index.html)
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Propiedades', path: '/propiedades' },
    { name: 'Sobre Mí', path: '/sobre-mi' },
    { name: 'Contacto', path: '/contacto' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const whatsappUrl = toWhatsAppUrl(CONTACT_INFO.whatsapp);

  return (
    <nav className="fixed top-0 w-full bg-white dark:bg-gray-900 shadow-sm z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex-shrink-0 flex flex-col">
            <Link to="/" className="text-xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">
              Escarleth <span className="text-[#800020] dark:text-[#a51a39]">Barreras</span>
            </Link>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-widest uppercase">Nueva Visión</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path) ? 'text-[#800020] dark:text-[#ff3b5c]' : 'text-gray-600 dark:text-gray-300 hover:text-[#800020] dark:hover:text-[#ff3b5c]'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              aria-label="Cambiar tema"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#800020] dark:bg-[#800020] text-white px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-[#600018] transition-all flex items-center space-x-2 shadow-sm"
            >
              <Phone size={16} />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Mobile menu and theme toggle button */}
          <div className="md:hidden flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-4 animate-in fade-in slide-in-from-top-4">
          <div className="px-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-3 text-base font-medium rounded-md ${
                  isActive(link.path) ? 'text-[#800020] dark:text-[#ff3b5c] bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-300 hover:text-[#800020] hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block w-full text-center bg-[#800020] text-white px-4 py-3 rounded-md font-semibold"
            >
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
