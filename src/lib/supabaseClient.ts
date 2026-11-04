import { createClient } from '@supabase/supabase-js';

const cleanSupabaseUrl = (url: string) => {
  if (!url) return 'https://placeholder.supabase.co';
  let clean = url.trim();
  if (clean.endsWith('/rest/v1')) clean = clean.replace('/rest/v1', '');
  if (clean.endsWith('/rest/v1/')) clean = clean.replace('/rest/v1/', '');
  if (clean.endsWith('/')) clean = clean.slice(0, -1);
  if (!clean.startsWith('http')) clean = `https://${clean}`;
  return clean;
};

const getStoredUrl = () => {
  try { return localStorage.getItem('supabase_url') || ''; } catch { return ''; }
};

const getStoredKey = () => {
  try { return localStorage.getItem('supabase_anon_key') || ''; } catch { return ''; }
};

let supabaseUrl = cleanSupabaseUrl(getStoredUrl() || import.meta.env.VITE_SUPABASE_URL || '');
let supabaseAnonKey = (getStoredKey() || import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder').trim();

export let supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const setSupabaseCredentials = (url: string, key: string) => {
  supabaseUrl = cleanSupabaseUrl(url);
  supabaseAnonKey = key.trim();
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
};

