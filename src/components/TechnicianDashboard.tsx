import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wrench, ClipboardList, ShieldCheck, Hammer, RotateCcw, AlertOctagon, Battery, GraduationCap, Coffee, LogOut, Play, CheckCircle, X, Search, Clock } from 'lucide-react';

interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  herramienta: string;
  started_at: string | null;
  tecnico_id: string;
}

export const TechnicianDashboard = ({ userId }: { userId: string }) => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [activeActivity, setActiveActivity] = useState<string | null>(null);
  const [herramientaInput, setHerramientaInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado para el cronómetro visual
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);

    fetchTareas();
    const channel = supabase
      .channel('tech-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tareas', filter: `tecnico_id=eq.${userId}` }, () => { fetchTareas(); })
      .subscribe();
      
    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(timer);
    };
  }, [userId]);

  const fetchTareas = async () => {
    const { data } = await supabase.from('tareas').select('*').neq('estado', 'terminado').order('created_at', { ascending: true });
    if (data) setTareas(data);
  };

  const intentarFinalizar = async (tarea: Tarea) => {
    if (!tarea.started_at) return;

    const inicio = new Date(tarea.started_at).getTime();
    const actual = new Date().getTime();
    const minutosTranscurridos = (actual - inicio) / 1000 / 60; 

    const TIEMPO_MINIMO = 1.0; 

    if (minutosTranscurridos < TIEMPO_MINIMO) {
      const confirmar = window.confirm(
        `⚠️ ALERTA DE CALIDAD\n\nEsta tarea lleva solo ${minutosTranscurridos.toFixed(1)} minutos.\nUna reparación real toma más tiempo.\n\n¿Fue un error de ingreso?\n\n- ACEPTAR: Cancelar tarea (Se borrará inmediatamente).\n- CANCELAR: Seguir trabajando.`
      );

      if (confirmar) {
        // AQUÍ ESTABA EL DETALLE: Agregamos manejo de error y actualización
        const { error } = await supabase.from('tareas').delete().eq('id', tarea.id);
        
        if (error) {
          alert("Error al borrar: " + error.message); // Si falla, te dirá por qué
        } else {
          // Si borra bien, actualizamos la lista visualmente
          fetchTareas(); 
        }
      }
      return; 
    }

    cambiarEstado(tarea.id, 'terminado');
  };

  const cambiarEstado = async (id: number, nuevoEstado: 'en_proceso' | 'terminado') => {
    const updateData: any = { estado: nuevoEstado };
    if (nuevoEstado === 'en_proceso') updateData.started_at = new Date().toISOString();
    if (nuevoEstado === 'terminado') updateData.finished_at = new Date().toISOString();
    
    await supabase.from('tareas').update(updateData).eq('id', id);
  };

  const handleBtnClick = (label: string) => {
    const tareaActiva = tareas.find(t => t.estado === 'en_proceso');
    if (tareaActiva) {
      alert(`⚠️ ACCIÓN DENEGADA\n\nYa tienes una actividad en curso:\n"${tareaActiva.titulo}"\n\nTermina tu trabajo actual antes de iniciar otro.`);
      return;
    }
    if (label === 'Desarme' || label === 'Rearme') {
      alert('Módulo en construcción.');
      return;
    }
    setActiveActivity(label);
    setHerramientaInput('');
  };

  const confirmarInicioActividad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!herramientaInput.trim()) return;
    setLoading(true);
    
    // CORRECCIÓN AQUÍ: 'herramienta' en lugar de 'ferramenta'
    const { error } = await supabase.from('tareas').insert({
      titulo: activeActivity, 
      herramienta: herramientaInput, 
      descripcion: 'Iniciado por técnico', 
      tecnico_id: userId, 
      sucursal: 'Sucursal Central', 
      estado: 'en_proceso', 
      started_at: new Date().toISOString()
    });

    if (error) alert('Error: ' + error.message);
    else setActiveActivity(null);
    setLoading(false);
  };

  const getTiempoTranscurrido = (startStr: string | null) => {
    if (!startStr) return '0m';
    const diff = now.getTime() - new Date(startStr).getTime();
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const menuButtons = [
    { label: 'Reparación', icon: Wrench, color: 'bg-blue-600', shadow: 'shadow-blue-200' },
    { label: 'Presupuesto', icon: ClipboardList, color: 'bg-purple-600', shadow: 'shadow-purple-200' },
    { label: 'Garantía', icon: ShieldCheck, color: 'bg-teal-600', shadow: 'shadow-teal-200' },
    { label: 'Desarme', icon: Hammer, color: 'bg-orange-600', shadow: 'shadow-orange-200' },
    { label: 'Rearme', icon: RotateCcw, color: 'bg-emerald-600', shadow: 'shadow-emerald-200' },
    { label: 'Re-Work', icon: AlertOctagon, color: 'bg-red-600', shadow: 'shadow-red-200' },
    { label: 'Atención B90', icon: Battery, color: 'bg-cyan-600', shadow: 'shadow-cyan-200' },
    { label: 'Capacitación', icon: GraduationCap, color: 'bg-pink-600', shadow: 'shadow-pink-200' },
  ];

  return (
    <div className="animate-fade-in relative">
      <div className="mb-8">
        <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><ClipboardList size={16} /> Registrar Nueva Actividad</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {menuButtons.map((btn) => (
            <button key={btn.label} onClick={() => handleBtnClick(btn.label)} className={`${btn.color} text-white p-6 rounded-2xl shadow-xl ${btn.shadow} hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center gap-3 group cursor-pointer border-b-4 border-black/10`}>
              <btn.icon size={32} strokeWidth={1.5} className="group-hover:rotate-12 transition-transform" />
              <span className="font-bold tracking-wide">{btn.label}</span>
            </button>
          ))}
        </div>

        {/* AQUÍ ESTÁN DE VUELTA TUS BOTONES :) */}
        <div className="flex justify-center gap-4 mt-6">
          <button className="bg-yellow-100 text-yellow-700 px-8 py-4 rounded-xl font-bold hover:bg-yellow-200 transition flex items-center gap-2 border border-yellow-200 shadow-sm">
            <Coffee size={20} /> Ir a Descanso
          </button>
          <button onClick={() => supabase.auth.signOut()} className="bg-slate-100 text-slate-600 px-8 py-4 rounded-xl font-bold hover:bg-slate-200 transition flex items-center gap-2 border border-slate-200 shadow-sm">
            <LogOut size={20} /> Marcar Salida
          </button>
        </div>
      </div>
      
      <hr className="border-gray-200 my-8" />

      <div>
        <h3 className="text-lg font-bold text-slate-700 mb-4">Mis Asignaciones Activas ({tareas.length})</h3>
        {tareas.length === 0 ? (
           <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400 flex flex-col items-center gap-2">
             <div className="bg-gray-50 p-4 rounded-full"><ClipboardList size={24} /></div><p>No tienes actividades en curso.</p>
           </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tareas.map((t) => (
              <div key={t.id} className={`bg-white p-6 rounded-2xl shadow-sm border relative overflow-hidden transition ${t.estado === 'en_proceso' ? 'border-blue-200 shadow-md ring-1 ring-blue-100' : 'border-gray-100'}`}>
                {t.estado === 'en_proceso' && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 animate-pulse">
                    <Clock size={12} /> {getTiempoTranscurrido(t.started_at)}
                  </div>
                )}
                
                <div className="mb-4 mt-2">
                  <h4 className="font-bold text-lg text-gray-800">{t.titulo}</h4>
                  <p className="text-sm text-gray-500 font-medium flex items-center gap-1"><Wrench size={12}/> {t.herramienta}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50">
                  {t.estado === 'pendiente' && (
                    <button onClick={() => cambiarEstado(t.id, 'en_proceso')} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 transition shadow-lg shadow-blue-200">
                      <Play size={18} fill="currentColor" /> INICIAR
                    </button>
                  )}
                  {t.estado === 'en_proceso' && (
                    <button onClick={() => intentarFinalizar(t)} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 transition shadow-lg shadow-green-200">
                      <CheckCircle size={18} /> FINALIZAR
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeActivity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2"><Play size={20} className="text-green-400" fill="currentColor"/> Iniciar {activeActivity}</h3>
              <button onClick={() => setActiveActivity(null)} className="text-gray-400 hover:text-white transition"><X /></button>
            </div>
            <form onSubmit={confirmarInicioActividad} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">{activeActivity === 'Capacitación' ? 'Tema' : 'Modelo Herramienta'}</label>
                <div className="relative"><Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" /><input autoFocus type="text" required className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition font-medium text-gray-800" placeholder="Ej: DHP483" value={herramientaInput} onChange={(e) => setHerramientaInput(e.target.value)} /></div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setActiveActivity(null)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition">{loading ? '...' : 'CONFIRMAR'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};