import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarGridProps {
  monthLabel: string;
  celdasMes: (Date | null)[];
  diasNombresCortos: string[];
  diasSemanaMapa: string[];
  diasHabilitados: string[];
  hoy: Date;
  fechaEntregaSeleccionada: string;
  onSelectFecha: (fecha: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  monthLabel, celdasMes, diasNombresCortos, diasSemanaMapa, diasHabilitados,
  hoy, fechaEntregaSeleccionada, onSelectFecha, onPrevMonth, onNextMonth,
}) => {
  return (
    <div className="border border-line rounded-card p-4 bg-paper shadow-xs">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={onPrevMonth} className="p-1.5 border border-line rounded-lg hover:bg-bg cursor-pointer"><ChevronLeft size={16}/></button>
        <span className="font-black text-sm text-ink uppercase tracking-wider">{monthLabel}</span>
        <button type="button" onClick={onNextMonth} className="p-1.5 border border-line rounded-lg hover:bg-bg cursor-pointer"><ChevronRight size={16}/></button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {diasNombresCortos.map(n => <span key={n} className="text-[10px] font-black uppercase text-ink-soft py-1">{n}</span>)}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {celdasMes.map((fechaCell, idx) => {
          if (!fechaCell) return <div key={`empty-${idx}`} />;

          const nombreDiaSemana = diasSemanaMapa[fechaCell.getDay()];
          const esDiaPermitido = diasHabilitados.includes(nombreDiaSemana);
          const esPasado = fechaCell < hoy;
          const puedePedir = esDiaPermitido && !esPasado;

          const diaNumero = fechaCell.getDate();
          const fechaStringFormato = `${nombreDiaSemana} ${String(diaNumero).padStart(2,'0')}/${String(fechaCell.getMonth()+1).padStart(2,'0')}`;
          const esSeleccionado = fechaEntregaSeleccionada === fechaStringFormato;

          return (
            <button
              key={idx}
              type="button"
              disabled={!puedePedir}
              onClick={() => onSelectFecha(fechaStringFormato)}
              className={`h-9 w-full rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                esSeleccionado ? 'bg-brand-gold text-brand-gold-on font-black ring-2 ring-brand-gold-deep' :
                puedePedir ? 'bg-success/10 text-success border border-success/30 hover:bg-success/20 cursor-pointer' :
                'bg-bg text-ink-soft opacity-30 cursor-not-allowed'
              }`}
            >
              {diaNumero}
            </button>
          );
        })}
      </div>
    </div>
  );
};
