// Credenciales directas para compatibilidad total con GitHub Pages
const SUPABASE_URL = "https://givqeblydihsmkrwnrnf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Egd_xz9MuKp2UCZLADHeFg_osfAqwGH";

// Inicializar el cliente de Supabase de manera global
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
