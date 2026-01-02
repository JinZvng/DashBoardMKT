import { LayoutDashboard, Wrench, MessageSquare, Trophy, LogOut, Search, History, Package, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: string;
  userName?: string;
}

export const Sidebar = ({ activeTab, setActiveTab, userRole, userName }: SidebarProps) => {
  
  // Definimos todos los menús posibles
  const allMenuItems = [
    { 
      id: 'dashboard', 
      label: userRole === 'tecnico' ? 'Mi Estación' : 'Vista General', // Cambia el nombre según rol
      icon: LayoutDashboard,
      visible: true 
    },
    { 
      id: 'taller', 
      label: 'Control Taller', 
      icon: Wrench, 
      visible: userRole !== 'tecnico' // <--- ¡AQUÍ ESTÁ EL CANDADO! Solo visible si NO es técnico
    },
    { id: 'inventario', label: 'Inventario', icon: Package, visible: true },
    { id: 'historial', label: 'Historial', icon: History, visible: true },
    { id: 'foro', label: 'Foro', icon: MessageSquare, visible: true },
    { id: 'niveles', label: 'Mis Niveles', icon: Trophy, visible: true },
    { 
      id: 'usuarios', 
      label: 'Gestión Usuarios', 
      icon: Users, 
      visible: userRole !== 'tecnico' // Solo para Jefes/Admin
    },
  ];

  // Filtramos solo los visibles
  const menuItems = allMenuItems.filter(item => item.visible);

  return (
    <div className="h-screen w-64 bg-[#0f172a] text-white fixed left-0 top-0 flex flex-col shadow-xl z-50">
      <div className="p-6 flex items-center gap-2 border-b border-gray-800">
        <a href="https://makita.cl">
            <img src="https://makita.cl/wp-content/uploads/2025/01/logo_makita.svg" style={{ width: '150px', height: '80px'}} />
        </a>
      </div>

      <div className="px-4 mt-6">
        <div className="bg-gray-800 rounded-lg flex items-center p-2 border border-gray-700">
          <Search className="text-gray-400 h-4 w-4 mr-2" />
          <input type="text" placeholder="Modelo (Ej: DHP483)" className="bg-transparent text-sm w-full outline-none text-gray-200 placeholder-gray-500" />
        </div>
        <button className="w-full mt-2 bg-red-600 hover:bg-red-700 text-xs font-bold py-2 rounded transition">BUSCAR MSI</button>
      </div>

      <nav className="flex-1 px-2 mt-8 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
              activeTab === item.id 
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/50' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800 bg-[#0b1120]">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center font-bold text-xs">
            {userName ? userName.substring(0,2).toUpperCase() : 'US'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName || 'Usuario'}</p>
            <p className="text-xs text-gray-500 truncate">{userRole.toUpperCase()}</p>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-gray-500 hover:text-red-400 transition"><LogOut size={16} /></button>
        </div>
      </div>
    </div>
  );
};