import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// BUSCA ESTA CLAVE EN TU PANEL DE SUPABASE (es secreta, no la subas a GitHub público)
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase');
}

// Cliente normal para el día a día
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// CLIENTE ADMIN: Este es el que usaremos para crear usuarios sin errores
// Se usa la Service Role Key para tener permisos totales
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || '');