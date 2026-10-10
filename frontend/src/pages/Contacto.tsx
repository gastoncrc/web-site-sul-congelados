import { MapPin, Mail } from 'lucide-react';
export const Contacto = () => (
  <div className="bg-paper rounded-card border border-line p-8 shadow-sm max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
    <div className="space-y-4">
      <h2 className="text-xl font-black text-brand-primary">CONTACTO</h2>
      <div className="flex items-center space-x-3 text-sm text-ink-soft"><MapPin size={16} /> <span>Córdoba, Argentina</span></div>
      <div className="flex items-center space-x-3 text-sm text-ink-soft"><Mail size={16} /> <span>contacto@sul.com</span></div>
    </div>
    <form onSubmit={(e) => { e.preventDefault(); alert('Mensaje comercial recibido.'); }} className="space-y-3">
      <input type="text" placeholder="Razón Social / Franquicia" className="w-full p-2.5 border border-line rounded-lg text-xs outline-none focus:border-brand-gold" required />
      <input type="email" placeholder="Correo de contacto" className="w-full p-2.5 border border-line rounded-lg text-xs outline-none focus:border-brand-gold" required />
      <textarea placeholder="Consulta de volumen logístico" rows={3} className="w-full p-2.5 border border-line rounded-lg text-xs outline-none focus:border-brand-gold" required></textarea>
      <button type="submit" className="w-full bg-brand-primary text-brand-primary-on py-2 rounded-lg font-bold text-xs hover:bg-brand-accent transition">Enviar Alta</button>
    </form>
  </div>
);