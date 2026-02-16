
import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Lead, City } from '../types';

interface LeadFormProps {
  source: 'home' | 'contacto' | 'propiedad';
  propertyId?: string;
  propertyTitle?: string;
}

const LeadForm: React.FC<LeadFormProps> = ({ source, propertyId, propertyTitle }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cityInterest: 'Tijuana' as City,
    operationType: 'Comprar' as 'Comprar' | 'Vender' | 'Traspasar',
    message: '',
    honeypot: '', // Invisible field to catch bots
  });

  const [budgetCurrency, setBudgetCurrency] = useState<'MXN' | 'USD'>('MXN');
  const [budgetDisplay, setBudgetDisplay] = useState('');
  const [budgetAmount, setBudgetAmount] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const formatAsTyping = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (parts.length > 2) return budgetDisplay;
    if (parts[1]) parts[1] = parts[1].slice(0, 2);
    return parts.join('.');
  };

  const formatOnBlur = (value: string) => {
    if (!value) return '';
    const numericValue = parseFloat(value.replace(/,/g, ''));
    if (isNaN(numericValue)) return '';
    setBudgetAmount(numericValue);
    const formatted = numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const prefix = budgetCurrency === 'USD' ? 'US$' : '$';
    const suffix = ` (${budgetCurrency})`;
    return `${prefix}${formatted}${suffix}`;
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) {
      setBudgetDisplay('');
      setBudgetAmount(null);
      return;
    }
    const cleanValue = value.replace(/[US$()\sMXN]/g, '');
    setBudgetDisplay(formatAsTyping(cleanValue));
  };

  const handleBudgetBlur = () => {
    setBudgetDisplay(formatOnBlur(budgetDisplay));
  };

  const handleBudgetFocus = () => {
    if (budgetAmount !== null) {
      const parts = budgetAmount.toString().split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      setBudgetDisplay(parts.join('.'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.honeypot) return;
    setIsLoading(true);
    setError('');
    try {
      const newLead: Partial<Lead> = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        cityInterest: formData.cityInterest,
        operationType: formData.operationType,
        budget: budgetDisplay,
        message: formData.message,
        propertyId,
        propertyTitle,
        source,
        status: 'nuevo',
      };
      
      await apiService.saveLead(newLead);
      
      setIsSuccess(true);
      setFormData({
        name: '', phone: '', email: '', cityInterest: 'Tijuana',
        operationType: 'Comprar', message: '', honeypot: '',
      });
      setBudgetDisplay('');
      setBudgetAmount(null);
    } catch (err) {
      setError('Hubo un error al enviar tus datos. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 text-center py-16 animate-in fade-in zoom-in">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Gracias por tu interés!</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Escarleth se pondrá en contacto contigo a la brevedad posible.</p>
        <button 
          onClick={() => setIsSuccess(false)}
          className="text-[#800020] dark:text-[#ff3b5c] font-bold hover:underline"
        >
          Enviar otra consulta
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
      <input type="text" name="honeypot" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" value={formData.honeypot} onChange={e => setFormData({...formData, honeypot: e.target.value})} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Nombre Completo *</label>
          <input required type="text" className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-[#800020]/10 transition-all" placeholder="Ej. Juan Pérez" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Teléfono / WhatsApp *</label>
          <input required type="tel" className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-[#800020]/10 transition-all" placeholder="Ej. 664 123 4567" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Ciudad de interés *</label>
          <select className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 dark:text-white rounded-xl outline-none" value={formData.cityInterest} onChange={e => setFormData({...formData, cityInterest: e.target.value as City})}>
            <option value="Tijuana">Tijuana</option>
            <option value="Rosarito">Rosarito</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Tipo de operación *</label>
          <select className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 dark:text-white rounded-xl outline-none" value={formData.operationType} onChange={e => setFormData({...formData, operationType: e.target.value as any})}>
            <option value="Comprar">Comprar</option>
            <option value="Vender">Vender</option>
            <option value="Traspasar">Traspasar</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Presupuesto aproximado (Opcional)</label>
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <input type="text" className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-[#800020]/10 transition-all" placeholder={budgetCurrency === 'MXN' ? '$0.00 (MXN)' : 'US$0.00 (USD)'} value={budgetDisplay} onChange={handleBudgetChange} onBlur={handleBudgetBlur} onFocus={handleBudgetFocus} />
          </div>
          <select className="p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 dark:text-white rounded-xl outline-none font-bold text-xs" value={budgetCurrency} onChange={(e) => {
              const newCurr = e.target.value as 'MXN' | 'USD';
              setBudgetCurrency(newCurr);
              if (budgetAmount !== null) {
                const formatted = budgetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const prefix = newCurr === 'USD' ? 'US$' : '$';
                const suffix = ` (${newCurr})`;
                setBudgetDisplay(`${prefix}${formatted}${suffix}`);
              }
            }}>
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Mensaje o dudas (Opcional)</label>
        <textarea rows={4} className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-[#800020]/10 transition-all resize-none" placeholder="Platícame más sobre lo que buscas..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
      </div>

      <button type="submit" disabled={isLoading} className="w-full bg-[#800020] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-[#600018] transition-all disabled:opacity-50 shadow-lg shadow-burgundy/20">
        <Send size={20} />
        {isLoading ? 'Enviando...' : 'Enviar Solicitud'}
      </button>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center uppercase tracking-widest">Al enviar, aceptas nuestro aviso de privacidad.</p>
    </form>
  );
};

export default LeadForm;
