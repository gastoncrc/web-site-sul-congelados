import React, { useState, useEffect } from 'react';
import { api } from '../../config/api';
import { formatPrice } from '../../../utils/currency';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Cell 
} from 'recharts';
import { TrendingUp, Users, ShoppingCart, DollarSign, Package } from 'lucide-react';

export const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/orders/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Error cargando estadísticas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) return <div className="text-center py-20 text-slate-400 font-bold animate-pulse text-sm">PROCESANDO ANALÍTICA DE VENTAS...</div>;

  const COLORS = ['#deff9a', '#94a3b8', '#475569', '#1e293b', '#0f172a'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 🚀 TARJETAS DE RESUMEN TÉCNICO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#020617] p-6 rounded-3xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-900/20 p-3 rounded-2xl text-green-400"><DollarSign size={24}/></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ingresos Totales</span>
          </div>
          <p className="text-3xl font-black text-white tracking-tighter">${formatPrice(parseFloat(stats.summary.total_revenue || 0))}</p>
        </div>
        <div className="bg-[#020617] p-6 rounded-3xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-900/20 p-3 rounded-2xl text-blue-400"><ShoppingCart size={24}/></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pedidos Realizados</span>
          </div>
          <p className="text-3xl font-black text-white tracking-tighter">{stats.summary.total_orders}</p>
        </div>
        <div className="bg-[#020617] p-6 rounded-3xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-indigo-900/20 p-3 rounded-2xl text-indigo-400"><Users size={24}/></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Clientes Activos</span>
          </div>
          <p className="text-3xl font-black text-white tracking-tighter">{stats.summary.total_clients}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 📊 GRÁFICO DE TENDENCIA DE VENTAS */}
        <div className="bg-[#020617] p-8 rounded-3xl border border-slate-800">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center">
            <TrendingUp size={14} className="mr-2 text-[#deff9a]" /> Ventas Últimos 7 Días
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.salesOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="total" stroke="#deff9a" strokeWidth={4} dot={{ r: 4, fill: '#deff9a' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🍰 TOP PRODUCTOS */}
        <div className="bg-[#020617] p-8 rounded-3xl border border-slate-800">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center">
            <Package size={14} className="mr-2 text-[#deff9a]" /> Top 5 Productos (Unidades)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} fontWeight="bold" width={100} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                />
                <Bar dataKey="value" fill="#deff9a" radius={[0, 4, 4, 0]} barSize={20}>
                  {stats.topProducts.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
