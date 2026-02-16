
import React from 'react';
import { ShieldCheck, Mail, Phone } from 'lucide-react';
import { CONTACT_INFO } from '../constants';

const Privacy: React.FC = () => {
  return (
    <div className="pt-24 pb-32 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12 border-b border-gray-100 dark:border-gray-800 pb-8 text-center">
          <div className="w-16 h-16 bg-burgundy/5 dark:bg-burgundy/10 text-[#800020] dark:text-[#ff3b5c] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
            Aviso de <span className="text-[#800020] dark:text-[#ff3b5c]">Privacidad</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Última actualización: Mayo 2024</p>
        </header>

        <div className="prose prose-burgundy dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-8 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">1. Responsable del Tratamiento</h2>
            <p>
              Escarleth Barreras, con domicilio en Tijuana, Baja California, es la responsable del tratamiento de sus datos personales. 
              Nos comprometemos a proteger la privacidad de la información que nos proporciona a través de este sitio web.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">2. Datos que Recabamos</h2>
            <p>Los datos que podemos solicitar incluyen, de manera enunciativa más no limitativa:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Nombre completo</li>
              <li>Número de teléfono (WhatsApp)</li>
              <li>Correo electrónico</li>
              <li>Interés específico en propiedades o servicios inmobiliarios</li>
              <li>Información sobre presupuesto o capacidad crediticia (opcional)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">3. Finalidad del Tratamiento</h2>
            <p>Sus datos personales serán utilizados exclusivamente para las siguientes finalidades:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Brindarle la asesoría inmobiliaria solicitada.</li>
              <li>Agendar visitas a propiedades de su interés.</li>
              <li>Proporcionar información sobre procesos de compra, venta o traspaso.</li>
              <li>Gestión de trámites relacionados con créditos hipotecarios (Infonavit/Bancarios).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">4. Derechos ARCO</h2>
            <p>
              Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). 
              Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); 
              que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo utilizada conforme a los principios, deberes y obligaciones previstos en la normativa (Cancelación); 
              así como oponerse al uso de sus datos personales para fines específicos (Oposición).
            </p>
          </section>

          <section className="bg-gray-50 dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">Contacto Directo</h2>
            <p className="mb-6">Para cualquier duda o ejercicio de sus derechos ARCO, puede contactarnos en:</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Mail className="text-[#800020] dark:text-[#ff3b5c]" size={20} />
                <span className="font-bold">{CONTACT_INFO.email}</span>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="text-[#800020] dark:text-[#ff3b5c]" size={20} />
                <span className="font-bold">{CONTACT_INFO.whatsapp}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
