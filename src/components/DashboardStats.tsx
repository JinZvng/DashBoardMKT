import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Clock, AlertCircle, TrendingUp, Trophy } from 'lucide-react';

export const DashboardStats = ({ sucursal }: { sucursal: string }) => {
  const [stats, setStats] = useState({ total: 0, pendientes: 0, proceso: 0, terminados: 0 });
  const [topTechnician, setTopTechnician] = useState({ name: 'Nadie aún', count: 0 });
  const [barData, setBarData] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();

    // Suscripción a cambios en tiempo real (Cualquier cambio recalcula todo)
    const channel = supabase
      .channel('stats-dashboard')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'tareas' }, 
        () => { fetchStats(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sucursal]);

  const fetchStats = async () => {
    // 1. Traemos TODAS las tareas de la sucursal y los perfiles de técnicos
    const { data: tasks } = await supabase.from('tareas').select('*').eq('sucursal', sucursal);
    const { data: profiles } = await supabase.from('profiles').select('id, nombre');

    if (tasks && profiles) {
      // --- A. ESTADÍSTICAS BÁSICAS ---
      setStats({
        total: tasks.length,
        pendientes: tasks.filter(t => t.estado === 'pendiente').length,
        proceso: tasks.filter(t => t.estado === 'en_proceso').length,
        terminados: tasks.filter(t => t.estado === 'terminado').length,
      });

      // --- B. CALCULAR TÉCNICO ESTRELLA (TOP 1) ---
      const conteoPorTecnico: Record<string, number> = {};
      tasks.forEach(t => {
        conteoPorTecnico[t.tecnico_id] = (conteoPorTecnico[t.tecnico_id] || 0) + 1;
      });

      let topId = '';
      let maxCount = 0;

      Object.entries(conteoPorTecnico).forEach(([id, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topId = id;
        }
      });

      const topName = profiles.find(p => p.id === topId)?.nombre || 'Sin datos';
      setTopTechnician({ name: maxCount > 0 ? topName : 'Nadie aún', count: maxCount });

      // --- C. CALCULAR GRÁFICO DE BARRAS (POR DÍA DE LA SEMANA) ---
      const conteoDias = [0, 0, 0, 0, 0]; // Contadores para cada día

      tasks.forEach(t => {
        const fecha = new Date(t.created_at);
        const diaIndex = fecha.getDay(); // 0 = Domingo, 1 = Lunes...
        conteoDias[diaIndex]++;
      });

      // Formateamos para el gráfico (Excluyendo Domingo si quieres, o dejándolo)
      const datosGrafico = [
        { name: 'Lun', tareas: conteoDias[1] },
        { name: 'Mar', tareas: conteoDias[2] },
        { name: 'Mie', tareas: conteoDias[3] },
        { name: 'Jue', tareas: conteoDias[4] },
        { name: 'Vie', tareas: conteoDias[5] },
      ];
      setBarData(datosGrafico);
    }
  };

  const dataPie = [
    { name: 'Pendientes', value: stats.pendientes, color: '#f59e0b' },
    { name: 'En Proceso', value: stats.proceso, color: '#3b82f6' },
    { name: 'Terminados', value: stats.terminados, color: '#10b981' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tarjeta 1: Total */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp size={24} /></div>
          <div><p className="text-xs font-bold text-gray-400 uppercase">Total Tareas</p><h3 className="text-2xl font-extrabold text-slate-800">{stats.total}</h3></div>
        </div>

        {/* Tarjeta 2: Pendientes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl"><AlertCircle size={24} /></div>
          <div><p className="text-xs font-bold text-gray-400 uppercase">Pendientes</p><h3 className="text-2xl font-extrabold text-slate-800">{stats.pendientes}</h3></div>
        </div>

        {/* Tarjeta 3: En Proceso */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Clock size={24} /></div>
          <div><p className="text-xs font-bold text-gray-400 uppercase">En Proceso</p><h3 className="text-2xl font-extrabold text-slate-800">{stats.proceso}</h3></div>
        </div>

        {/* Tarjeta 4: TÉCNICO ESTRELLA (NUEVO) */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10"><Trophy size={64} className="text-orange-500"/></div>
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl z-10"><Trophy size={24} /></div>
          <div className="z-10">
            <p className="text-xs font-bold text-orange-400 uppercase">Más Productivo</p>
            <h3 className="text-lg font-extrabold text-slate-800 truncate w-32 md:w-auto" title={topTechnician.name}>
              {topTechnician.name}
            </h3>
            <p className="text-xs text-orange-600 font-bold">{topTechnician.count} Tareas</p>
          </div>
        </div>
      </div>

      {/* 2. GRÁFICOS DINÁMICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRÁFICO DE TORTA */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 flex flex-col">
          <h3 className="font-bold text-slate-700 mb-4">Estado Actual del Taller</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dataPie} cx="50%" cy="50%" innerRadius={80} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                  {dataPie.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">{dataPie.map((item) => (<div key={item.name} className="flex items-center gap-2 text-sm font-medium text-gray-500"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>{item.name}</div>))}</div>
        </div>

        {/* GRÁFICO DE BARRAS (REAL POR DÍA) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 flex flex-col">
          <h3 className="font-bold text-slate-700 mb-4">Actividad Semanal (Tareas Creadas)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff' }} />
                <Bar dataKey="tareas" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};