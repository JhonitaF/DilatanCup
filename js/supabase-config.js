// Conexión directa y limpia para GitHub Pages
const SUPABASE_URL = "https://givqeblydihsmkrwnrnf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Egd_xz9MuKp2UCZLADHeFg_osfAqwGH";

// Inicializamos usando la librería global
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
