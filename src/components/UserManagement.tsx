import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { UserPlus, Search, Edit2, Trash2, X, Save, CheckCircle } from 'lucide-react';

interface Profile {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  sucursal: string;
}

export const UserManagement = ({ currentUserBranch }: { currentUserBranch: string }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    rol: 'tecnico',
    sucursal: currentUserBranch
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('nombre');
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ email: '', password: '', nombre: '', rol: 'tecnico', sucursal: currentUserBranch });
    setIsModalOpen(true);
  };

  const EditarUsuario = (user: Profile) => {
    setEditingUser(user);
    setFormData({ 
      email: user.email, 
      password: '', 
      nombre: user.nombre, 
      rol: user.rol, 
      sucursal: user.sucursal 
    });
    setIsModalOpen(true);
  };

  const EliminarUsuario = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar a este usuario del sistema?')) return;
    
    // Al eliminar de profiles, recuerda que también deberías eliminar de Auth si es real
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) alert('Error: ' + error.message);
    else fetchUsers();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUser) {
        // --- MODO EDICIÓN ---
        const { error } = await supabase
          .from('profiles')
          .update({
            nombre: formData.nombre,
            rol: formData.rol,
            sucursal: formData.sucursal
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        alert('Usuario actualizado correctamente.');

      } else {
        // --- MODO CREACIÓN (NUEVO MOTOR) ---
        if (formData.password.length < 6) {
          alert("La contraseña debe tener al menos 6 caracteres.");
          setLoading(false);
          return;
        }

        // 1. Crear en Auth con supabaseAdmin (Bypassea confirmación de email)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true,
          user_metadata: { 
            nombre: formData.nombre, 
            rol: formData.rol, 
            sucursal: formData.sucursal 
          }
        });

        if (authError) throw authError;

        // 2. Crear en tabla Profiles si Auth fue exitoso
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: authData.user.id,
              nombre: formData.nombre,
              email: formData.email,
              rol: formData.rol,
              sucursal: formData.sucursal
            }]);

          if (profileError) throw profileError;
        }

        alert(`✅ ÉXITO: Usuario ${formData.email} creado y activo para entrar.`);
      }

      setIsModalOpen(false);
      fetchUsers();
      setFormData({ email: '', password: '', nombre: '', rol: 'tecnico', sucursal: currentUserBranch });

    } catch (error: any) {
      console.error('Error:', error);
      alert('❌ Error: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Gestión de Usuarios</h2>
          <p className="text-gray-500 text-sm">Administración de perfiles y accesos</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2 transition"
        >
          <UserPlus size={20} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o correo..." 
          className="flex-1 outline-none text-gray-700"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase text-xs font-bold">
            <tr>
              <th className="p-4 pl-6">Usuario</th>
              <th className="p-4">Rol</th>
              <th className="p-4">Sucursal</th>
              <th className="p-4 text-right pr-6">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-blue-50/50 transition">
                <td className="p-4 pl-6">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${user.rol === 'admin' ? 'bg-orange-500' : 'bg-slate-600'}`}>
                      {user.nombre.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{user.nombre}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    user.rol === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.rol}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600 font-medium">
                  {user.sucursal}
                </td>
                <td className="p-4 text-right pr-6">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => EditarUsuario(user)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => EliminarUsuario(user.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-slate-800">
                {editingUser ? 'Editar Usuario' : 'Registrar Nuevo Personal'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                <input required type="text" className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 bg-gray-50" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Corporativo</label>
                  <input required type="email" disabled={!!editingUser} className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 bg-gray-50 disabled:opacity-50" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña Inicial</label>
                    <input required type="password" className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 bg-gray-50" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rol</label>
                  <select className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 bg-white" value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})} >
                    <option value="tecnico">Técnico</option>
                    <option value="administrativo">Administrativo</option>
                    <option value="encargado">Encargado Sucursal</option>
                    <option value="jefatura">Jefatura</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sucursal</label>
                  <select className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 bg-white" value={formData.sucursal} onChange={e => setFormData({...formData, sucursal: e.target.value})}>
                    <option value="Sucursal Santiago">Sucursal Santiago</option>
                    <option value="Sucursal Antofagasta">Sucursal Antofagasta</option>
                    <option value="Sucursal Copiapo">Sucursal Copiapo</option>
                    <option value="Sucursal Temuco">Sucursal Temuco</option>
                  </select>
                </div>
              </div>

              {!editingUser && (
                <div className="bg-green-50 p-3 rounded-lg flex gap-2 items-start text-xs text-green-700 border border-green-100">
                  <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <p>Acceso directo habilitado. El usuario no necesitará confirmar su correo para iniciar sesión.</p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center gap-2">
                  <Save size={20} /> {loading ? 'Guardando...' : 'Guardar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};