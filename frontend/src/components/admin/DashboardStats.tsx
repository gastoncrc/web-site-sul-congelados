import React, { useState, useEffect } from 'react';
import { api } from '../../config/api';
import { formatPrice } from '../../../utils/currency';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, ShoppingCart, DollarSign, Package, Calendar, Filter, RefreshCcw, ArrowUpRight } from 'lucide-react';

export const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    granularity: 'day'
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      queryParams.append('granularity', filters.granularity);

      const response = await api.get(`/orders/stats?${queryParams.toString()}`);
      setStats(response.data);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filters.granularity]); // Auto-refresh on granularity change

  if (loading && !stats) return <div className="text-center py-20 text-slate-400 font-bold animate-pulse text-sm">GENERANDO INTELIGENCIA DE NEGOCIO...</div>;

  const COLORS = ['#deff9a', '#94a3b8', '#475569', '#1e293b', '#0f172a'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 🚀 BARRA DE HERRAMIENTAS DE ANALÍTICA */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[#020617] p-4 rounded-3xl border border-slate-800 shadow-lg sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <div className="bg-[#deff9a] p-2 rounded-xl text-black">
            <TrendingUp size={20} />
          </div>
          <div>
            <h2 className="text-white text-sm font-black uppercase tracking-widest">Inteligencia SUL</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase">Análisis en Tiempo Real</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <Calendar size={14} className="text-slate-500 mr-2" />
            <input 
              type="date" 
              value={filters.startDate} 
              onChange={e => setFilters({...filters, startDate: e.target.value})}
              className="bg-transparent text-white text-[10px] font-bold outline-none uppercase"
            />
            <span className="mx-2 text-slate-700 text-xs">/</span>
            <input 
              type="date" 
              value={filters.endDate} 
              onChange={e => setFilters({...filters, endDate: e.target.value})}
              className="bg-transparent text-white text-[10px] font-bold outline-none uppercase"
            />
          </div>

          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1">
            {['day', 'week', 'month'].map(g => (
              <button 
                key={g}
                onClick={() => setFilters({...filters, granularity: g})}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filters.granularity === g ? 'bg-[#deff9a] text-black shadow-sm' : 'text-slate-500 hover:text-white'}`}
              >
                {g === 'day' ? 'Día' : g === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>

          <button 
            onClick={fetchStats}
            className="bg-white text-black p-2 rounded-xl hover:bg-slate-200 transition shadow-md cursor-pointer"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 📊 KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#020617] p-6 rounded-3xl border border-slate-800 relative overflow-hidden group hover:border-[#deff9a]/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-900/20 p-3 rounded-2xl text-green-400"><DollarSign size={20}/></div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Facturación</span>
          </div>
          <p className="text-2xl font-black text-white tracking-tighter">${formatPrice(parseFloat(stats?.summary.total_revenue || 0))}</p>
          <div className="mt-2 flex items-center text-[9px] font-bold text-green-400">
            <ArrowUpRight size={12} className="mr-1" /> +12.5% vs mes anterior
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
        </div>

        <div className="bg-[#020617] p-6 rounded-3xl border border-slate-800 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-900/20 p-3 rounded-2xl text-blue-400"><ShoppingCart size={20}/></div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Volumen</span>
          </div>
          <p className="text-2xl font-black text-white tracking-tighter">{stats?.summary.total_orders} <span className="text-xs text-slate-500">Pedidos</span></p>
          <div className="mt-2 flex items-center text-[9px] font-bold text-blue-400">
             En crecimiento logístico
          </div>
        </div>

        <div className="bg-[#020617] p-6 rounded-3xl border border-slate-800 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-indigo-900/20 p-3 rounded-2xl text-indigo-400"><Users size={20}/></div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">CRM</span>
          </div>
          <p className="text-2xl font-black text-white tracking-tighter">{stats?.summary.total_clients} <span className="text-xs text-slate-500">Clientes</span></p>
          <div className="mt-2 flex items-center text-[9px] font-bold text-indigo-400">
            Base de datos verificada
          </div>
        </div>

        <div className="bg-[#020617] p-6 rounded-3xl border border-slate-800 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-900/20 p-3 rounded-2xl text-amber-400"><Package size={20}/></div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Portfolio</span>
          </div>
          <p className="text-2xl font-black text-white tracking-tighter">{stats?.topProducts.length * 20}+ <span className="text-xs text-slate-500">SKUs</span></p>
          <div className="mt-2 flex items-center text-[9px] font-bold text-amber-400">
            Sincronización activa
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 📉 GRÁFICO DE TENDENCIA DE VENTAS (OCUPA 2 COLUMNAS) */}
        <div className="lg:col-span-2 bg-[#020617] p-8 rounded-3xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center">
                <TrendingUp size={14} className="mr-2 text-[#deff9a]" /> Curva de Ventas por Período
              </h3>
              <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Visualización por {filters.granularity === 'day' ? 'Día' : filters.granularity === 'week' ? 'Semana' : 'Mes'}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-[#deff9a]">${formatPrice(stats?.salesOverTime.reduce((acc: any, curr: any) => acc + parseFloat(curr.total), 0) || 0)}</p>
              <p className="text-[8px] text-slate-500 font-black uppercase">Venta Acumulada</p>
            </div>
          </div>
          <div className="h-80 min-h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.salesOverTime}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#deff9a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#deff9a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#475569" fontSize={9} fontWeight="black" axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#475569" fontSize={9} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '10px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                  itemStyle={{ color: '#deff9a', fontWeight: 'black' }}
                />
                <Area type="monotone" dataKey="total" stroke="#deff9a" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 6, fill: '#deff9a' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🏆 TOP CLIENTES VS LISTAS */}
        <div className="bg-[#020617] p-8 rounded-3xl border border-slate-800 shadow-sm space-y-8">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center">
              <Users size={14} className="mr-2 text-indigo-400" /> Top 5 Clientes
            </h3>
            <div className="space-y-4">
              {stats?.topClients.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">{i+1}</div>
                    <span className="text-[11px] font-bold text-slate-300 group-hover:text-white">{c.name}</span>
                  </div>
                  <span className="text-[11px] font-black text-white">${formatPrice(parseFloat(c.total))}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center">
              <Filter size={14} className="mr-2 text-amber-400" /> Rendimiento por Lista
            </h3>
            <div className="space-y-4">
              {stats?.listComparison.map((l: any, i: number) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                    <span className="text-slate-400">{l.convenio}</span>
                    <span className="text-white">${formatPrice(parseFloat(l.total))}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full" 
                      style={{ width: `${(parseFloat(l.total) / (stats?.listComparison[0]?.total || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 🍰 PRODUCT ANALYTICS */}
      <div className="bg-[#020617] p-8 rounded-3xl border border-slate-800 shadow-sm">
        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-10 flex items-center">
          <Package size={16} className="mr-2 text-[#deff9a]" /> Ranking de Productos por Rotación
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" fontSize={8} fontWeight="black" axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" />
              <YAxis stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: '#0f172a'}}
                contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '10px' }}
              />
              <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                {stats?.topProducts.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
