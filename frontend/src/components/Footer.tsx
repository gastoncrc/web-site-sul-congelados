import React from 'react';
import { ClipboardCheck, ChefHat, DollarSign, Settings2 } from 'lucide-react';

// Mismos 4 pilares de marca que la home del catálogo — acá se repiten
// compactos para reforzar la propuesta de valor en el resto del sitio
// (Nosotros, Contacto, checkout), donde hoy no aparecían.
const PILARES_FOOTER = [
  { Icon: ClipboardCheck, title: 'Estandarización total' },
  { Icon: ChefHat, title: '0% merma' },
  { Icon: DollarSign, title: 'Costos previsibles' },
  { Icon: Settings2, title: 'A tu medida' },
];

export const Footer: React.FC = () => (
  <footer className="bg-neutral-dark text-ink-soft border-t border-black/20">
    <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 py-5">
      {PILARES_FOOTER.map(({ Icon, title }) => (
        <div key={title} className="flex items-center gap-2 justify-center sm:justify-start">
          <Icon size={14} className="text-brand-gold shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-white/70">{title}</span>
        </div>
      ))}
    </div>
    <div className="py-6 text-center text-[11px] px-4 border-t border-black/20">
      <p className="font-bold text-white/80 mb-1">SUL Alimentos & Congelados © 2026</p>
      <p>Infraestructura Logística B2B para Canales de Distribución y Redes Gastronómicas.</p>
    </div>
  </footer>
);