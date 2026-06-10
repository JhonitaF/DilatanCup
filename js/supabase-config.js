// Leer las variables de entorno configuradas en Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Inicializar el cliente de Supabase de manera global
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);