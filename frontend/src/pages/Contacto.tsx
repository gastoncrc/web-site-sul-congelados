import React from 'react';
import { MapPin, Mail } from 'lucide-react';
export const Contacto = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
    <div className="space-y-4">
      <h2 className="text-xl font-black text-[#003366]">CONTACTO</h2>
      <div className="flex items-center space-x-3 text-sm text-gray-600"><MapPin size={16} /> <span>Córdoba, Argentina</span></div>
      <div className="flex items-center space-x-3 text-sm text-gray-600"><Mail size={16} /> <span>contacto@sul.com</span></div>
    </div>
    <form onSubmit={(e) => { e.preventDefault(); alert('Mensaje comercial recibido.'); }} className="space-y-3">
      <input type="text" placeholder="Razón Social / Franquicia" className="w-full p-2.5 border rounded-lg text-xs" required />
      <input type="email" placeholder="Correo de contacto" className="w-full p-2.5 border rounded-lg text-xs" required />
      <textarea placeholder="Consulta de volumen logístico" rows={3} className="w-full p-2.5 border rounded-lg text-xs" required></textarea>
      <button type="submit" className="w-full bg-[#003366] text-white py-2 rounded-lg font-bold text-xs hover:bg-blue-800 transition">Enviar Alta</button>
    </form>
  </div>
);