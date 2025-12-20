import { createClient } from '@supabase/supabase-js';

// REPLACE THESE WITH YOUR ACTUAL SUPABASE CREDENTIALS
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Add this log to debug (Remove later)
console.log("Supabase URL:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseKey);