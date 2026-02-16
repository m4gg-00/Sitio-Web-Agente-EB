
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, MapPin } from 'lucide-react';
import { apiService } from '../services/apiService';
import PropertyCard from '../components/PropertyCard';
import { Property, City, PropertyType } from '../types';

const Properties: React.FC = () => {
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filterCity, setFilterCity] = useState<string>('Todas');
  const [filterType, setFilterType] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const props = await apiService.getProperties(false);
      setAllProperties(props);
      setIsLoading(false);
    };
    load();
  }, []);

  const filteredProperties = useMemo(() => {
    return allProperties.filter(prop => {
      const matchCity = filterCity === 'Todas' || prop.city === filterCity;
      const matchType = filterType === 'Todos' || prop.type === filterType;
      const matchSearch = prop.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          prop.zone.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCity && matchType && matchSearch;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [allProperties, filterCity, filterType, searchTerm, sortBy]);

  return (
    <div className="pt-24 pb-24 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-tight">Catálogo de <span className="text-[#800020] dark:text-[#ff3b5c]">Propiedades</span></h1>
          <p className="text-gray-600 dark:text-gray-400">Encuentra tu próximo hogar o inversión entre nuestras opciones exclusivas.</p>
        </header>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-12 sticky top-24 z-40 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar zona o título..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <select
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] transition-all text-sm appearance-none bg-no-repeat"
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
              >
                <option value="Todas">Todas las Ciudades</option>
                <option value="Tijuana">Tijuana</option>
                <option value="Rosarito">Rosarito</option>
              </select>
            </div>

            <div>
              <select
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] transition-all text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="Todos">Todos los Tipos</option>
                <option value="Casa">Casa</option>
                <option value="Departamento">Departamento</option>
                <option value="Terreno">Terreno</option>
                <option value="Local">Local</option>
              </select>
            </div>

            <div>
              <select
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] transition-all text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Más Recientes</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
              </select>
            </div>

            <div className="flex items-center justify-end">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                {filteredProperties.length} resultados
              </p>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="py-20 text-center dark:text-white">Cargando catálogo...</div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredProperties.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
            <SlidersHorizontal size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sin resultados</h3>
            <p className="text-gray-500 dark:text-gray-400">No encontramos propiedades con esos filtros.</p>
            <button 
              onClick={() => { setFilterCity('Todas'); setFilterType('Todos'); setSearchTerm(''); }}
              className="mt-6 text-[#800020] dark:text-[#ff3b5c] font-bold hover:underline"
            >
              Limpiar todos los filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;
