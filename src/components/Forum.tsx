import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Send, MessageSquare, ThumbsUp, Users, Megaphone, MapPin } from 'lucide-react';

interface Post {
  id: number;
  content: string;
  author_name: string;
  author_role: string;
  created_at: string;
  likes: number;
  is_announcement: boolean;
}

interface Profile {
  id: string;
  nombre: string;
  rol: string;
  sucursal: string;
}

export const Forum = ({ userProfile }: { userProfile: Profile }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [tecnicosSucursal, setTecnicosSucursal] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchTeam();

    const channel = supabase
      .channel('forum-updates')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' }, 
        () => {
          // Estrategia infalible: Si pasa algo, recargamos la lista oficial
          fetchPosts();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile.sucursal]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .or(`sucursal.eq.${userProfile.sucursal},is_announcement.eq.true`) // Mi sucursal O anuncios
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setPosts(data);
  };

  const fetchTeam = async () => {
    // Obtenemos a los colegas de la misma sucursal para el directorio
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('sucursal', userProfile.sucursal);
    if (data) setTecnicosSucursal(data);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setLoading(true);


    const { error } = await supabase.from('posts').insert({
      content: newPost,
      author_id: userProfile.id, // Necesario para RLS, aunque no lo consultemos directo
      author_name: userProfile.nombre,
      author_role: userProfile.rol,
      sucursal: userProfile.sucursal,
      is_announcement: false // Por defecto false, para simplificar
    });

    if (error) alert(error.message);
    else setNewPost('');
    
    setLoading(false);
  };

  return (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)]">
      
      {/* COLUMNA IZQUIERDA: MURO DE PUBLICACIONES (2/3 del ancho) */}
      <div className="lg:col-span-2 flex flex-col gap-6 h-full overflow-hidden">
        
        {/* Caja de publicar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-shrink-0">
          <h3 className="text-sm font-bold text-gray-500 mb-2 flex items-center gap-2">
            <MessageSquare size={16} /> MURO DE {userProfile.sucursal.toUpperCase()}
          </h3>
          <form onSubmit={handlePublish} className="flex gap-4">
            <input
              type="text"
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder={`Comparte algo con el equipo de ${userProfile.sucursal}...`}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
            <button 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-bold shadow-lg shadow-blue-200 transition flex items-center gap-2"
            >
              <Send size={18} /> {loading ? '...' : 'Enviar'}
            </button>
          </form>
        </div>

        {/* Lista de Posts (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4 scrollbar-hide">
          {posts.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p>El muro está vacío.</p>
              <p className="text-sm">¡Sé el primero en saludar!</p>
            </div>
          )}

          {posts.map((post) => (
            <div key={post.id} className={`p-5 rounded-2xl shadow-sm border relative ${post.is_announcement ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
              
              {/* Badge de Anuncio */}
              {post.is_announcement && (
                <div className="absolute -top-3 -right-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Megaphone size={10} /> ANUNCIO
                </div>
              )}

              <div className="flex items-start gap-3 mb-2">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${post.author_role === 'tecnico' ? 'bg-slate-700' : 'bg-orange-500'}`}>
                  {post.author_name.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{post.author_name}</h4>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 flex items-center gap-1">
                    {post.author_role} • {new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 text-sm ml-14 leading-relaxed">{post.content}</p>
              
              <div className="ml-14 mt-3 flex items-center gap-4">
                <button className="text-gray-400 hover:text-blue-500 text-xs font-bold flex items-center gap-1 transition">
                  <ThumbsUp size={14} /> Me gusta
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COLUMNA DERECHA: DIRECTORIO DE TÉCNICOS (1/3 del ancho) */}
      <div className="hidden lg:flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50 bg-gray-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-blue-500" size={20} /> Equipo Local
          </h3>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <MapPin size={10} /> {userProfile.sucursal}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tecnicosSucursal.map((tech) => (
            <div key={tech.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition cursor-default group">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs text-white ${tech.rol === 'admin' ? 'bg-orange-500' : 'bg-slate-300 group-hover:bg-blue-500 transition-colors'}`}>
                {tech.nombre.substring(0,2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700 group-hover:text-blue-700 transition">{tech.nombre}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  tech.rol === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tech.rol}
                </span>
              </div>
              {/* Indicador de estado visual (Adorno) */}
              <div className="ml-auto w-2 h-2 rounded-full bg-green-500" title="Online"></div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50/30 text-center">
          <button className="text-xs font-bold text-blue-600 hover:underline">
            + Invitar nuevo técnico
          </button>
        </div>
      </div>

    </div>
  );
};