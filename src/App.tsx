import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
// Importamos los componentes nuevos que creaste
import { TechnicianDashboard } from './components/TechnicianDashboard';
import { InventoryView } from './components/InventoryView';
import { TaskModal } from './components/TaskModal';
import { DashboardStats } from './components/DashboardStats';
import { Forum } from './components/Forum';
import { UserManagement } from './components/UserManagement';


// Iconos
import { Users, Wrench, CheckCircle2, Hammer } from 'lucide-react';

// Interfaces
interface Profile {
  id: string;
  nombre: string;
  rol: 'tecnico' | 'admin' | 'encargado' | 'jefatura';
  sucursal: string;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
  };

  if (!session) return <Login />;
  if (!profile) {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      <p className="text-gray-500">Cargando perfil de usuario...</p>
      
      {/* Botón de emergencia para salir si se queda pegado */}
      <button 
        onClick={() => supabase.auth.signOut()} 
        className="text-sm text-red-500 hover:underline cursor-pointer"
      >
        ¿Se quedó pegado? Cerrar Sesión
      </button>
    </div>
  );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      {/* 1. SIDEBAR FIJO */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={profile.rol}
        userName={profile.nombre}
      />

      {/* 2. CONTENIDO PRINCIPAL */}
      <main className="flex-1 ml-64 p-8 transition-all duration-300">
        
        {/* HEADER SUPERIOR */}
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 uppercase tracking-tight">
              {/* Título dinámico según la pestaña */}
              {activeTab === 'dashboard' ? (profile.rol === 'tecnico' ? 'CONTROL OPERATIVO' : 'VISTA GENERAL') : ''}
              {activeTab === 'taller' ? 'CONTROL TALLER' : ''}
              {activeTab === 'inventario' ? 'GESTIÓN DE STOCK' : ''}
            </h2>
            <p className="text-gray-500 text-sm font-medium mt-1">Sucursal: {profile.sucursal}</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-full shadow-sm border text-sm font-bold text-slate-600 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             {new Date().toLocaleDateString()}
          </div>
        </header>

        {/* --- ZONA DE CONTENIDO DINÁMICO --- */}
        <div className="mt-8">
          
          {/* CASO 1: VISTA DASHBOARD (MI ESTACIÓN) */}
          {activeTab === 'dashboard' && (
            profile.rol === 'tecnico' 
              ? <TechnicianDashboard userId={session.user.id} /> 
              : <DashboardStats sucursal={profile.sucursal} /> // <--- ¡AQUÍ ESTÁ EL CAMBIO!
          )}

          {/* CASO 2: VISTA TALLER (SOLO JEFATURA) */}
          {activeTab === 'taller' && (
            <AdminView sucursal={profile.sucursal} />
          )}

          {/* CASO 3: INVENTARIO */}
          {activeTab === 'inventario' && (
            <InventoryView />
          )}

          {activeTab === 'foro' && (
             <Forum userProfile={profile} />
          )}

          {/* 5. GESTIÓN DE USUARIOS */}
          {activeTab === 'usuarios' && (
             <UserManagement currentUserBranch={profile.sucursal} />
          )}
          
          
          {/* CASO 4: PESTAÑAS EN CONSTRUCCIÓN (Foro, Historial, etc) */}
          {['niveles', 'historial'].includes(activeTab) && (
             <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
                <Wrench className="mb-4 h-10 w-10 text-gray-300" />
                <p className="font-bold">Módulo en construcción</p>
             </div>
          )}

        </div>
      </main>
    </div>
  );
}

// --------------------------------------------------------
// VISTA ADMINISTRATIVA (CONTROL TALLER)
// La dejamos aquí porque ya la tenías lista y funciona bien
// --------------------------------------------------------
const AdminView = ({ sucursal }: { sucursal: string }) => {
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  
  // Estados para el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTech, setSelectedTech] = useState<{id: string, nombre: string} | null>(null);

  useEffect(() => {
    fetchTecnicosStatus();
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tareas' }, () => {
        fetchTecnicosStatus(); 
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchTecnicosStatus = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').eq('rol', 'tecnico').eq('sucursal', sucursal);
    if (!profiles) return;

    const tecnicosConEstado = await Promise.all(profiles.map(async (tech) => {
      const { data: tareas } = await supabase
        .from('tareas').select('*').eq('tecnico_id', tech.id).neq('estado', 'terminado').order('created_at', { ascending: false }).limit(1);
      
      const tareaActiva = tareas && tareas.length > 0 ? tareas[0] : null;
      return {
        ...tech,
        status: tareaActiva ? 'OCUPADO' : 'DISPONIBLE',
        actividad: tareaActiva ? tareaActiva.titulo : 'Sin actividad',
        tipo: tareaActiva ? tareaActiva.herramienta : '',
      };
    }));
    setTecnicos(tecnicosConEstado);
  };

  const handleOpenModal = (tech: any) => {
    setSelectedTech({ id: tech.id, nombre: tech.nombre });
    setIsModalOpen(true);
  };

  const handleAssignTask = async (tipoTarea: string) => {
    if (!selectedTech) return;
    const { error } = await supabase.from('tareas').insert({
      titulo: tipoTarea,
      descripcion: `Asignado por jefatura`,
      herramienta: 'Pendiente de asignar',
      tecnico_id: selectedTech.id,
      sucursal: sucursal,
      estado: 'pendiente'
    });
    if (error) alert('Error: ' + error.message);
    setIsModalOpen(false);
    fetchTecnicosStatus();
  };

  const totalTecnicos = tecnicos.length;
  const ocupados = tecnicos.filter(t => t.status === 'OCUPADO').length;
  const disponibles = totalTecnicos - ocupados;

  return (
    <div className="animate-fade-in space-y-8">
      {/* KPIs */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-500">RESUMEN OPERATIVO</h2>
        </div>
        <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-orange-200 flex items-center gap-2 transition">
          <Hammer size={20} /> GESTIÓN DESARMES
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div><p className="text-xs font-bold text-gray-400 uppercase">Total Técnicos</p><p className="text-4xl font-extrabold text-slate-800">{totalTecnicos}</p></div>
          <div className="p-3 bg-slate-100 rounded-xl text-slate-600"><Users size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div><p className="text-xs font-bold text-gray-400 uppercase">En Reparación</p><p className="text-4xl font-extrabold text-blue-600">{ocupados}</p></div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Wrench size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div><p className="text-xs font-bold text-gray-400 uppercase">Disponibles</p><p className="text-4xl font-extrabold text-green-600">{disponibles}</p></div>
          <div className="p-3 bg-green-50 rounded-xl text-green-600"><CheckCircle2 size={24} /></div>
        </div>
      </div>

      {/* GRID TÉCNICOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tecnicos.map((tech) => (
          <div key={tech.id} className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all hover:shadow-md ${tech.status === 'OCUPADO' ? 'border-blue-100' : 'border-gray-100'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-lg">{tech.nombre.substring(0,2).toUpperCase()}</div>
                <div>
                  <h3 className="font-bold text-slate-800">{tech.nombre}</h3>
                  <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-gray-400 uppercase">📍 {tech.sucursal || 'SANTIAGO'}</div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide ${tech.status === 'OCUPADO' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{tech.status}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 min-h-[100px] flex flex-col justify-center items-center text-center">
               {tech.status === 'OCUPADO' ? (
                 <><Wrench className="text-blue-400 mb-2 h-6 w-6" /><p className="font-bold text-slate-700">{tech.actividad}</p><p className="text-xs text-gray-400 mt-1">En proceso...</p></>
               ) : (<p className="text-gray-400 text-sm font-medium">Sin actividad registrada</p>)}
            </div>
            <button onClick={() => handleOpenModal(tech)} className="w-full py-3 rounded-xl border-2 border-teal-500 text-teal-600 font-bold hover:bg-teal-50 transition uppercase tracking-wide text-sm">Gestionar</button>
          </div>
        ))}
      </div>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} technicianName={selectedTech?.nombre || ''} onAssign={handleAssignTask} />
    </div>
  );
};