import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Lock, ArrowLeft } from 'lucide-react';
import { apiService } from '../../services/apiService';

const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const success = await apiService.login(password);
      if (success) {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Error al intentar iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-8 bg-[#800020] text-center">
          <Home size={48} className="text-white mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">BIENVENIDO</h2>
          <p className="text-white/70 text-sm">Panel de Administración</p>
        </div>
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Código de Acceso</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] transition-all outline-none"
                placeholder="Ingresa el código"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-xs font-bold">{error}</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#800020] text-white font-bold rounded-xl hover:bg-[#600018] transition-all shadow-lg shadow-burgundy/20 disabled:opacity-50"
            >
              {isLoading ? 'Verificando...' : 'Entrar al Panel'}
            </button>
            <Link
              to="/"
              className="w-full py-3 text-gray-500 dark:text-gray-400 font-semibold text-sm hover:text-gray-900 dark:hover:text-white transition-all flex items-center justify-center gap-2 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Regresar al inicio
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;