-- =========================================================================
-- PERAPIAN DATABASE PTN (SUMBER: data/dataptn_mediascanter.sql)
-- =========================================================================
-- Masalah yang diperbaiki:
--   1) Tabel `majors` berisi 2 salinan identik (10.300 baris untuk 5.150 kode).
--   2) `institutions.grade` / `range_min` / `range_max` masih NULL sehingga
--      tie-break "kampus favorit" pada rekomendasi tidak berfungsi.
--   3) Nama `UIN AR` tidak lengkap.
--
-- Script ini AMAN untuk target user:
--   - target_institutions di-remap ke id prodi yang dipertahankan SEBELUM
--     baris duplikat dihapus.
--   - backup penuh dibuat lebih dulu (tidak menimpa backup lama).
--
-- Jalankan di Supabase SQL Editor. Script idempotent: aman dijalankan ulang.
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- 0) Backup (hanya dibuat sekali agar backup asli tidak tertimpa)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS backup_majors_fix AS SELECT * FROM majors;
CREATE TABLE IF NOT EXISTS backup_institutions_fix AS SELECT * FROM institutions;
CREATE TABLE IF NOT EXISTS backup_target_institutions_fix AS SELECT * FROM target_institutions;

-- -------------------------------------------------------------------------
-- 1) Peta duplikat: setiap baris duplikat -> id baris yang dipertahankan
--    (id terkecil per `code` yang dinormalisasi).
-- -------------------------------------------------------------------------
CREATE TEMP TABLE _major_dupes ON COMMIT DROP AS
SELECT
  m.id AS old_id,
  k.keep_id
FROM majors m
JOIN (
  SELECT
    NULLIF(btrim(code), '') AS code_key,
    MIN(id) AS keep_id
  FROM majors
  WHERE code IS NOT NULL AND btrim(code) <> ''
  GROUP BY NULLIF(btrim(code), '')
) k ON NULLIF(btrim(m.code), '') = k.code_key
WHERE m.id <> k.keep_id;

-- -------------------------------------------------------------------------
-- 2) Remap target user sebelum duplikat dihapus.
--    Duplikat target untuk user+major yang sama dibuang (prioritas terkecil
--    dipertahankan) agar tidak melanggar unique constraint, bila ada.
-- -------------------------------------------------------------------------
CREATE TEMP TABLE _targets_remapped ON COMMIT DROP AS
SELECT
  t.id,
  t.user_id,
  t.student_id,
  COALESCE(d.keep_id, t.major_id) AS major_id,
  t.priority
FROM target_institutions t
LEFT JOIN _major_dupes d ON d.old_id = t.major_id;

DELETE FROM _targets_remapped a
USING _targets_remapped b
WHERE a.user_id IS NOT DISTINCT FROM b.user_id
  AND a.major_id = b.major_id
  AND a.id <> b.id
  AND (
    COALESCE(a.priority, 2147483647) > COALESCE(b.priority, 2147483647)
    OR (
      COALESCE(a.priority, 2147483647) = COALESCE(b.priority, 2147483647)
      AND a.id > b.id
    )
  );

DELETE FROM _targets_remapped a
USING _targets_remapped b
WHERE a.student_id IS NOT NULL
  AND a.student_id = b.student_id
  AND a.major_id = b.major_id
  AND a.id <> b.id
  AND (
    COALESCE(a.priority, 2147483647) > COALESCE(b.priority, 2147483647)
    OR (
      COALESCE(a.priority, 2147483647) = COALESCE(b.priority, 2147483647)
      AND a.id > b.id
    )
  );

-- Hapus baris target yang kalah dalam dedupe di atas.
DELETE FROM target_institutions t
WHERE NOT EXISTS (
  SELECT 1 FROM _targets_remapped r WHERE r.id = t.id
);

-- Arahkan target yang tersisa ke id prodi yang dipertahankan.
UPDATE target_institutions t
SET major_id = r.major_id
FROM _targets_remapped r
WHERE t.id = r.id
  AND t.major_id IS DISTINCT FROM r.major_id;

-- -------------------------------------------------------------------------
-- 3) Hapus salinan prodi duplikat.
-- -------------------------------------------------------------------------
DELETE FROM majors m
USING _major_dupes d
WHERE m.id = d.old_id;

-- Cegah duplikasi kembali saat import dijalankan ulang.
CREATE UNIQUE INDEX IF NOT EXISTS ux_majors_code
  ON majors (code)
  WHERE code IS NOT NULL;

-- -------------------------------------------------------------------------
-- 4) Isi grade & range kampus otomatis dari PG prodi di kampus tsb.
--    grade     = rata-rata passing_grade_total
--    range_min = PG terendah
--    range_max = PG tertinggi
-- -------------------------------------------------------------------------
UPDATE institutions i
SET
  grade = s.avg_pg,
  range_min = s.min_pg,
  range_max = s.max_pg
FROM (
  SELECT
    institution_id,
    ROUND(AVG(passing_grade_total)::numeric, 2)::double precision AS avg_pg,
    MIN(passing_grade_total) AS min_pg,
    MAX(passing_grade_total) AS max_pg
  FROM majors
  WHERE passing_grade_total IS NOT NULL
  GROUP BY institution_id
) s
WHERE i.id = s.institution_id;

-- -------------------------------------------------------------------------
-- 5) Perbaiki nama kampus yang tidak lengkap.
-- -------------------------------------------------------------------------
UPDATE institutions
SET name = 'UNIVERSITAS ISLAM NEGERI AR-RANIRY'
WHERE upper(btrim(name)) IN ('UIN AR', 'UIN AR-RANIRY', 'UIN AR RANIRY', 'UIN ARRANIRY');

UPDATE institutions
SET abbreviation = 'UIN AR-RANIRY'
WHERE upper(btrim(abbreviation)) IN ('UIN AR', 'UIN AR RANIRY', 'UIN ARRANIRY');

-- -------------------------------------------------------------------------
-- 6) Opsional: izinkan pembacaan master prodi tanpa login.
--    Aktifkan hanya jika aplikasi memang perlu menampilkan prodi sebelum
--    pengguna masuk. Data ini bukan data pribadi.
-- -------------------------------------------------------------------------
-- ALTER TABLE majors ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "public_read_majors" ON majors;
-- CREATE POLICY "public_read_majors" ON majors FOR SELECT USING (true);

NOTIFY pgrst, 'reload schema';

COMMIT;

-- =========================================================================
-- VERIFIKASI (jalankan setelah COMMIT)
-- =========================================================================
SELECT 'majors_total' AS metric, count(*) AS value FROM majors
UNION ALL
SELECT 'majors_unique_code', count(DISTINCT NULLIF(btrim(code), '')) FROM majors
UNION ALL
SELECT 'institutions_total', count(*) FROM institutions
UNION ALL
SELECT 'institutions_grade_filled', count(*) FROM institutions WHERE grade IS NOT NULL
UNION ALL
SELECT 'targets_total', count(*) FROM target_institutions;
