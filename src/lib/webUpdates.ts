import { supabase } from './supabaseClient';

export interface WebUpdate {
  id: number;
  message: string;
  commit_sha: string | null;
  created_at: string;
}

/**
 * Ambil riwayat update web yang ditulis otomatis saat deploy/build.
 * RLS di database membatasi baris ini hanya untuk_admin, jadi aman dipanggil
 * langsung dari klien selama pemakainya login sebagai admin.
 */
export async function listWebUpdates(limit = 30): Promise<WebUpdate[]> {
  const { data, error } = await supabase
    .from('web_updates')
    .select('id, message, commit_sha, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as WebUpdate[];
}
