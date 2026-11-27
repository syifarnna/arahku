-- Log otomatis update web: satu baris untuk setiap deploy/build yang sukses.
-- Isi diambil dari pesan commit Git (lihat scripts/record-deploy.mjs).
-- Tabel ini append-only untuk klien: hanya service role yang boleh menulis.
CREATE TABLE IF NOT EXISTS public.web_updates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message TEXT NOT NULL CHECK (btrim(message) <> ''),
  commit_sha TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS web_updates_created_at_idx
  ON public.web_updates (created_at DESC);

ALTER TABLE public.web_updates ENABLE ROW LEVEL SECURITY;

-- Tabel baru tidak otomatis terekspos ke Data API; berikan SELECT hanya
-- kepada peran authenticated. Role anon tetap tidak punya akses.
REVOKE ALL ON public.web_updates FROM anon, authenticated;
GRANT SELECT ON public.web_updates TO authenticated;

-- Log update hanya untuk admin. Penulisan dilakukan build script memakai
-- service role yang melewati RLS, jadi tidak ada policy INSERT/UPDATE/DELETE.
DROP POLICY IF EXISTS web_updates_select_admin ON public.web_updates;
CREATE POLICY web_updates_select_admin ON public.web_updates
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Entri awal agar popup tidak kosong saat fitur pertama kali dibuka.
INSERT INTO public.web_updates (message, commit_sha)
VALUES ('Perbaikan data prodi Mediascanter 2026 & kunci aksi admin read-only', '6fd87fc')
ON CONFLICT (commit_sha) DO NOTHING;

NOTIFY pgrst, 'reload schema';
