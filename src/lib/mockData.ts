import { Competency, Institution, Major, Profile, Tryout, TryoutResult } from '../types';

export const INITIAL_COMPETENCIES: Competency[] = [
  { id: 1, code: 'PU', name: 'Penalaran Umum', description: 'Kemampuan memecahkan masalah baru dengan logika rasional.', weight: 1 },
  { id: 2, code: 'PPU', name: 'Pengetahuan & Pemahaman Umum', description: 'Kemampuan memahami kaidah dasar informasi & kebahasaan.', weight: 1 },
  { id: 3, code: 'PBM', name: 'Kemampuan Memahami Bacaan', description: 'Kemampuan membaca teks kompleks dan menarik kesimpulan kritis.', weight: 1 },
  { id: 4, code: 'PK', name: 'Pengetahuan Kuantitatif', description: 'Kemampuan berhitung, aljabar, geometri, dan statistika dasar.', weight: 1.2 },
  { id: 5, code: 'LBI', name: 'Literasi Bahasa Indonesia', description: 'Kemampuan memahami, menggunakan, & merefleksikan teks berbahasa Indonesia.', weight: 1 },
  { id: 6, code: 'LBE', name: 'Literasi Bahasa Inggris', description: 'Kemampuan memahami esai akademis & teks jurnal ilmiah berbahasa Inggris.', weight: 1.1 },
  { id: 7, code: 'PM', name: 'Penalaran Matematika', description: 'Kemampuan menganalisis masalah kontekstual kehidupan nyata secara matematis.', weight: 1.3 }
];

export const INITIAL_INSTITUTIONS: Institution[] = [
  { id: 101, name: 'Institut Teknologi Bandung (ITB)', type: 'PTN' },
  { id: 102, name: 'Universitas Indonesia (UI)', type: 'PTN' },
  { id: 103, name: 'Universitas Gadjah Mada (UGM)', type: 'PTN' },
  { id: 104, name: 'Institut Teknologi Sepuluh Nopember (ITS)', type: 'PTN' },
  { id: 105, name: 'Universitas Padjadjaran (UNPAD)', type: 'PTN' },
  { id: 106, name: 'Universitas Airlangga (UNAIR)', type: 'PTN' },
  { id: 107, name: 'Universitas Brawijaya (UB)', type: 'PTN' },
  { id: 108, name: 'Institut Pertanian Bogor (IPB University)', type: 'PTN' },
  { id: 109, name: 'Universitas Diponegoro (UNDIP)', type: 'PTN' },
  { id: 110, name: 'Politeknik Keuangan Negara STAN', type: 'Kedinasan' },
  { id: 111, name: 'Politeknik Statistika STIS', type: 'Kedinasan' },
  { id: 112, name: 'Telkom University', type: 'PTS' },
  { id: 113, name: 'Universitas Bina Nusantara (BINUS)', type: 'PTS' }
];

export const INITIAL_MAJORS: Major[] = [
  // ITB
  { id: 1, institution_id: 101, institution_name: 'Institut Teknologi Bandung (ITB)', institution_type: 'PTN', name: 'Sekolah Teknik Elektro & Informatika (STEI - Komputasi)', cluster: 'Saintek', passing_grade_total: 738.5, requirements: { PK: 720, PM: 740, PU: 700 } },
  { id: 2, institution_id: 101, institution_name: 'Institut Teknologi Bandung (ITB)', institution_type: 'PTN', name: 'Fakultas Teknik Pertambangan & Perminyakan (FTTM)', cluster: 'Saintek', passing_grade_total: 712.0, requirements: { PK: 700, PM: 710 } },
  { id: 3, institution_id: 101, institution_name: 'Institut Teknologi Bandung (ITB)', institution_type: 'PTN', name: 'Sekolah Bisnis dan Manajemen (SBM)', cluster: 'Soshum', passing_grade_total: 718.0, requirements: { PU: 710, LBE: 700 } },
  { id: 4, institution_id: 101, institution_name: 'Institut Teknologi Bandung (ITB)', institution_type: 'PTN', name: 'Fakultas Seni Rupa dan Desain (FSRD)', cluster: 'Soshum', passing_grade_total: 685.0, requirements: { PBM: 680 } },

  // UI
  { id: 5, institution_id: 102, institution_name: 'Universitas Indonesia (UI)', institution_type: 'PTN', name: 'Pendidikan Dokter', cluster: 'Saintek', passing_grade_total: 754.2, requirements: { PK: 740, PM: 750, LBE: 720 } },
  { id: 6, institution_id: 102, institution_name: 'Universitas Indonesia (UI)', institution_type: 'PTN', name: 'Ilmu Hukum', cluster: 'Soshum', passing_grade_total: 708.5, requirements: { PU: 700, PBM: 710, LBI: 710 } },
  { id: 7, institution_id: 102, institution_name: 'Universitas Indonesia (UI)', institution_type: 'PTN', name: 'Psikologi', cluster: 'Soshum', passing_grade_total: 715.0, requirements: { PU: 720, PBM: 700 } },
  { id: 8, institution_id: 102, institution_name: 'Universitas Indonesia (UI)', institution_type: 'PTN', name: 'Sistem Informasi', cluster: 'Saintek', passing_grade_total: 710.0, requirements: { PK: 700, PM: 690 } },

  // UGM
  { id: 9, institution_id: 103, institution_name: 'Universitas Gadjah Mada (UGM)', institution_type: 'PTN', name: 'Teknologi Informasi', cluster: 'Saintek', passing_grade_total: 722.0, requirements: { PK: 710, PM: 720 } },
  { id: 10, institution_id: 103, institution_name: 'Universitas Gadjah Mada (UGM)', institution_type: 'PTN', name: 'Kedokteran', cluster: 'Saintek', passing_grade_total: 748.0, requirements: { PK: 730, PM: 740 } },
  { id: 11, institution_id: 103, institution_name: 'Universitas Gadjah Mada (UGM)', institution_type: 'PTN', name: 'Akuntansi', cluster: 'Soshum', passing_grade_total: 698.0, requirements: { PK: 680, PU: 690 } },
  { id: 12, institution_id: 103, institution_name: 'Universitas Gadjah Mada (UGM)', institution_type: 'PTN', name: 'Hubungan Internasional', cluster: 'Soshum', passing_grade_total: 702.5, requirements: { LBE: 710, PBM: 690 } },

  // ITS
  { id: 13, institution_id: 104, institution_name: 'Institut Teknologi Sepuluh Nopember (ITS)', institution_type: 'PTN', name: 'Teknik Informatika', cluster: 'Saintek', passing_grade_total: 716.0, requirements: { PK: 710, PM: 720 } },
  { id: 14, institution_id: 104, institution_name: 'Institut Teknologi Sepuluh Nopember (ITS)', institution_type: 'PTN', name: 'Teknik Industri', cluster: 'Saintek', passing_grade_total: 689.0, requirements: { PK: 690 } },
  { id: 15, institution_id: 104, institution_name: 'Institut Teknologi Sepuluh Nopember (ITS)', institution_type: 'PTN', name: 'Statistika', cluster: 'Saintek', passing_grade_total: 682.0, requirements: { PK: 700, PM: 690 } },

  // UNPAD
  { id: 16, institution_id: 105, institution_name: 'Universitas Padjadjaran (UNPAD)', institution_type: 'PTN', name: 'Ilmu Komunikasi', cluster: 'Soshum', passing_grade_total: 684.0, requirements: { LBI: 690, PPU: 680 } },
  { id: 17, institution_id: 105, institution_name: 'Universitas Padjadjaran (UNPAD)', institution_type: 'PTN', name: 'Bisnis Digital', cluster: 'Saintek', passing_grade_total: 675.5, requirements: { PK: 670, PU: 680 } },
  { id: 18, institution_id: 105, institution_name: 'Universitas Padjadjaran (UNPAD)', institution_type: 'PTN', name: 'Farmasi', cluster: 'Saintek', passing_grade_total: 680.0, requirements: { PK: 680 } },

  // UNAIR & UB
  { id: 19, institution_id: 106, institution_name: 'Universitas Airlangga (UNAIR)', institution_type: 'PTN', name: 'Kedokteran Gigi', cluster: 'Saintek', passing_grade_total: 705.0, requirements: { PK: 700 } },
  { id: 20, institution_id: 107, institution_name: 'Universitas Brawijaya (UB)', institution_type: 'PTN', name: 'Ilmu Hukum', cluster: 'Soshum', passing_grade_total: 668.0, requirements: { PBM: 670 } },
  { id: 21, institution_id: 107, institution_name: 'Universitas Brawijaya (UB)', institution_type: 'PTN', name: 'Teknik Komputer', cluster: 'Saintek', passing_grade_total: 662.5, requirements: { PK: 660 } },

  // IPB & UNDIP
  { id: 22, institution_id: 108, institution_name: 'IPB University', institution_type: 'PTN', name: 'Ilmu Komputer', cluster: 'Saintek', passing_grade_total: 694.0, requirements: { PK: 700 } },
  { id: 23, institution_id: 109, institution_name: 'Universitas Diponegoro (UNDIP)', institution_type: 'PTN', name: 'Manajemen', cluster: 'Soshum', passing_grade_total: 672.0, requirements: { PU: 670 } },

  // Kedinasan
  { id: 24, institution_id: 110, institution_name: 'Politeknik Keuangan Negara STAN', institution_type: 'Kedinasan', name: 'D4 Akuntansi Sektor Publik', cluster: 'Campuran', passing_grade_total: 712.5, requirements: { PK: 700, PU: 710, LBE: 690 } },
  { id: 25, institution_id: 111, institution_name: 'Politeknik Statistika STIS', institution_type: 'Kedinasan', name: 'D4 Statistika Komputasi', cluster: 'Saintek', passing_grade_total: 695.0, requirements: { PK: 710, PM: 700 } },

  // PTS
  { id: 26, institution_id: 112, institution_name: 'Telkom University', institution_type: 'PTS', name: 'S1 Rekayasa Perangkat Lunak', cluster: 'Saintek', passing_grade_total: 610.0, requirements: { PK: 600 } },
  { id: 27, institution_id: 113, institution_name: 'Universitas Bina Nusantara (BINUS)', institution_type: 'PTS', name: 'Computer Science', cluster: 'Saintek', passing_grade_total: 615.0, requirements: { PK: 610 } },
  { id: 28, institution_id: 107, institution_name: 'Universitas Brawijaya (UB)', institution_type: 'PTN', name: 'Agribisnis', cluster: 'Saintek', passing_grade_total: 635.0, requirements: { PU: 630 } },
  { id: 29, institution_id: 105, institution_name: 'Universitas Padjadjaran (UNPAD)', institution_type: 'PTN', name: 'Sastra Inggris', cluster: 'Soshum', passing_grade_total: 648.0, requirements: { LBE: 680 } },
  { id: 30, institution_id: 109, institution_name: 'Universitas Diponegoro (UNDIP)', institution_type: 'PTN', name: 'Teknik Sipil', cluster: 'Saintek', passing_grade_total: 668.5, requirements: { PK: 670 } }
];

export const INITIAL_TRYOUTS: Tryout[] = [
  { id: 1, name: 'Simulasi Akbar Nasional UTBK SNBT 2026 - Episode 1', date: '2026-05-10', type: 'UTBK SNBT', duration_minutes: 195, question_count: 155, status: 'Selesai', description: 'Simulasi resmi menguji 7 komponen subtes sesuai standar SNBT SNPMB terbaru.' },
  { id: 2, name: 'Simulasi Akbar Nasional UTBK SNBT 2026 - Episode 2', date: '2026-06-15', type: 'UTBK SNBT', duration_minutes: 195, question_count: 155, status: 'Selesai', description: 'Simulasi penguatan penalaran matematika & literasi akademis tingkat tinggi.' },
  { id: 3, name: 'Tryout Intensif Kedinasan STAN & STIS 2026', date: '2026-06-20', type: 'Ujian Kedinasan', duration_minutes: 120, question_count: 100, status: 'Tersedia', description: 'Ujian SKD & Tes Potensi Akademik khusus seleksi masuk perguruan tinggi kedinasan.' }
];

export const EMPTY_PROFILE: Profile = {
  id: '',
  full_name: '',
  nisn: '',
  email: '',
  phone: '',
  school: '',
  major_interest: null,
  avatar_url: '',
  role: 'peserta',
  is_profile_complete: false,
  // Default TIDAK memaksa ganti password. Profil kosong ini dipakai sebelum data
  // profil asli termuat dari Supabase; flag dikoreksi dari DB setelah sync.
  // Hanya akun buatan Admin (password default) atau hasil reset yang di-set true.
  must_change_password: false,
  updated_at: new Date().toISOString()
};

export const INITIAL_RESULTS: TryoutResult[] = [
  {
    id: 1001,
    student_id: 'usr-student-001',
    tryout_id: 1,
    tryout_name: 'Simulasi Akbar Nasional UTBK SNBT 2026 - Episode 1',
    tryout_type: 'UTBK SNBT',
    tryout_date: '2026-05-10',
    total_score: 642.8,
    predicate: 'Baik',
    created_at: '2026-05-10T14:30:00Z',
    scores: {
      PU: 680,
      PPU: 650,
      PBM: 670,
      PK: 610,
      LBI: 690,
      LBE: 580, // Weakest in tryout 1
      PM: 620
    }
  },
  {
    id: 1002,
    student_id: 'usr-student-001',
    tryout_id: 2,
    tryout_name: 'Simulasi Akbar Nasional UTBK SNBT 2026 - Episode 2',
    tryout_type: 'UTBK SNBT',
    tryout_date: '2026-06-15',
    total_score: 688.5,
    predicate: 'Baik',
    created_at: '2026-06-15T15:00:00Z',
    scores: {
      PU: 725,
      PPU: 710,
      PBM: 700,
      PK: 665, // Still below STEI ITB requirement (720)
      LBI: 740,
      LBE: 630, // Improved but still below target (700)
      PM: 650  // Below target (740)
    }
  }
];

export const SUPABASE_SQL_BLUEPRINT = `-- =========================================================================
-- SYNC CSV PROFILES -> SUPABASE AUTH USERS + FIX SCHEMA
-- Jalankan ini SETELAH import CSV ke public.profiles
-- =========================================================================

-- 1) Pastikan ekstensi pgcrypto tersedia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Bersihkan data: trim spasi dari nisn, auth_uid = id
UPDATE public.profiles SET nisn = TRIM(nisn::text) WHERE nisn IS DISTINCT FROM TRIM(nisn::text);
UPDATE public.profiles SET auth_uid = id WHERE auth_uid IS NULL OR auth_uid::text = '';

-- 3) Isi email kosong (nisn@peserta.com)
UPDATE public.profiles SET email = nisn::text || '@peserta.com' WHERE (email IS NULL OR email = '') AND nisn IS NOT NULL;

-- 4) Perbaiki schema auth.users (tambah kolom yang mungkin hilang)
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_sso_user boolean DEFAULT false;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS phone_change text;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS phone_change_token text;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS phone_change_sent_at timestamptz;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email_change_confirm_status smallint DEFAULT 0;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS banned_until timestamptz;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS reauthentication_token text;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS reauthentication_sent_at timestamptz;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_super_admin boolean;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 5) Perbaiki schema auth.identities (tambah kolom yang mungkin hilang)
ALTER TABLE auth.identities ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE auth.identities ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz;

-- 6) Hapus trigger bermasalah (auto_confirm_email) jika ada
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_email;

-- 7) RPC: cari email berdasarkan NISN
CREATE OR REPLACE FUNCTION public.get_email_by_nisn(p_nisn text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN (SELECT email FROM public.profiles WHERE nisn::text = p_nisn LIMIT 1);
END;
$$;

-- 8) RPC: buat akun auth users + identities untuk profile yang belum punya
CREATE OR REPLACE FUNCTION public.sync_profile_auth_user(p_nisn text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions
AS $$
DECLARE
  v_id text; v_auth_uid text; v_full_name text; v_email text; v_nisn text;
  v_new_auth_uid uuid;
BEGIN
  SELECT id::text, auth_uid::text, full_name, email, nisn::text
    INTO v_id, v_auth_uid, v_full_name, v_email, v_nisn
    FROM public.profiles WHERE nisn::text = p_nisn LIMIT 1;
  IF v_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'NISN tidak ditemukan'); END IF;
  IF v_auth_uid IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_auth_uid::uuid) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Akun ini sudah memiliki akses login');
  END IF;
  v_new_auth_uid := gen_random_uuid();
  UPDATE public.profiles SET auth_uid = v_new_auth_uid::text WHERE id = v_id;
  IF v_email IS NULL OR TRIM(v_email) = '' THEN v_email := v_nisn || '@peserta.com'; UPDATE public.profiles SET email = v_email WHERE id = v_id; END IF;
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', v_new_auth_uid, 'authenticated', 'authenticated', v_email, crypt('Password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', v_full_name, 'nisn', v_nisn, 'must_change_password', true), '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_new_auth_uid, jsonb_build_object('sub', v_new_auth_uid::text, 'email', v_email), 'email', v_new_auth_uid::text, now(), now(), now());
  UPDATE public.profiles SET must_change_password = true WHERE id = v_id;
  RETURN jsonb_build_object('success', true, 'email', v_email);
END;
$$;

-- 9) RPC: reset password profile yang sudah punya auth user
CREATE OR REPLACE FUNCTION public.reset_password_by_nisn(p_nisn text, p_new_password text DEFAULT 'Password123')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions
AS $$
DECLARE v_auth_uid text; v_email text;
BEGIN
  SELECT auth_uid::text, email INTO v_auth_uid, v_email FROM public.profiles WHERE nisn::text = p_nisn LIMIT 1;
  IF v_auth_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'NISN tidak ditemukan'); END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_auth_uid::uuid) THEN RETURN jsonb_build_object('success', false, 'error', 'Akun auth belum dibuat'); END IF;
  UPDATE auth.users u SET encrypted_password = crypt(p_new_password, gen_salt('bf')), email_confirmed_at = COALESCE(u.email_confirmed_at, now()), updated_at = now() FROM public.profiles p WHERE u.id = p.auth_uid::uuid AND p.nisn::text = p_nisn;
  UPDATE public.profiles SET must_change_password = true WHERE nisn::text = p_nisn;
  RETURN jsonb_build_object('success', true, 'email', v_email);
END;
$$;

-- 10) HAPUS & BUAT ULANG auth user untuk NISN tertentu (ganti NISN sesuai kebutuhan)
-- ========== UNCOMMENT & JALANKAN untuk reset user tertentu ==========
-- DO $$
-- DECLARE v_auth_uid text; v_email text; v_nisn text := '8921971441';
-- BEGIN
--   SELECT auth_uid::text, email INTO v_auth_uid, v_email FROM public.profiles WHERE nisn::text = v_nisn;
--   IF v_auth_uid IS NOT NULL THEN
--     DELETE FROM auth.identities WHERE user_id = v_auth_uid::uuid;
--     DELETE FROM auth.users WHERE id = v_auth_uid::uuid;
--     UPDATE public.profiles SET auth_uid = gen_random_uuid()::text WHERE nisn::text = v_nisn;
--   END IF;
-- END $$;
-- SELECT public.sync_profile_auth_user('8921971441');
-- ================================================================

-- 11) Batch insert auth.users (skip existing)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
SELECT '00000000-0000-0000-0000-000000000000', p.auth_uid::uuid, 'authenticated', 'authenticated', p.email, crypt('Password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', p.full_name, 'nisn', p.nisn), '', '', '', ''
FROM public.profiles p
WHERE p.email IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.auth_uid::uuid)
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.email = p.email);

-- 12) Batch insert auth.identities (skip existing)
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), p.auth_uid::uuid, jsonb_build_object('sub', p.auth_uid, 'email', p.email), 'email', p.auth_uid, now(), now(), now()
FROM public.profiles p
WHERE p.email IS NOT NULL
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.auth_uid::uuid)
  AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = p.auth_uid::uuid AND i.provider = 'email');

-- 13) Confirm email
UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE email_confirmed_at IS NULL;

-- 14) Trigger handle_new_user: buat profil otomatis saat registrasi.
--     Penting:
--     - Registrasi mandiri (signUp) TIDAK memaksa ganti password.
--       Hanya akun buatan Admin (metadata must_change_password=true) yang dipaksa ganti.
--     - Role dari metadata signUp DIABAIKAN. Registrasi publik SELALU 'peserta'.
--       Hanya admin (lewat halaman manajemen admin) yang boleh memberi role 'admin'.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, auth_uid, email, full_name, nisn, school, role,
    must_change_password, is_profile_complete, updated_at
  )
  VALUES (
    new.id::text,
    new.id::text,
    new.email,
    COALESCE(NULLIF(new.raw_user_meta_data->>'full_name',''), ''),
    NULLIF(new.raw_user_meta_data->>'nisn',''),
    NULLIF(new.raw_user_meta_data->>'school',''),
    'peserta',
    COALESCE((new.raw_user_meta_data->>'must_change_password')::boolean, false),
    false,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    auth_uid = excluded.auth_uid,
    email    = excluded.email,
    full_name = COALESCE(NULLIF(excluded.full_name,''), public.profiles.full_name),
    nisn      = COALESCE(excluded.nisn, public.profiles.nisn),
    school    = COALESCE(excluded.school, public.profiles.school),
    -- Role TIDAK pernah ditimpa dari metadata; pertahankan role yang tersimpan.
    role      = public.profiles.role,
    must_change_password = COALESCE((new.raw_user_meta_data->>'must_change_password')::boolean, public.profiles.must_change_password);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14b) KEAMANAN: hanya admin UTAMA (admin1) yang boleh mengubah kolom 'role'
--      dan membaca riwayat login seluruh akun. Satu titik hardcode ID admin1.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.uid())::text = '38f32ff8-1940-44ca-9457-0a52d0fbc2fe';
$$;

--      Admin lain yang mencoba mengubah role akan ditolak dengan error 42501
--      (insufficient_privilege) sehingga kegagalan terlihat jelas di aplikasi,
--      bukan dibatalkan secara senyap.
CREATE OR REPLACE FUNCTION public.guard_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Hanya admin utama yang dapat mengubah peran pengguna.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_role_trg ON public.profiles;
CREATE TRIGGER guard_profile_role_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_role();

-- 14c) KEAMANAN: user biasa hanya boleh insert profil dirinya sendiri,
--      dan tidak boleh berperan 'admin'.
DROP POLICY IF EXISTS own_insert ON public.profiles;
CREATE POLICY own_insert ON public.profiles
  FOR INSERT
  WITH CHECK (
    (
      (auth_uid = (auth.uid())::text OR id = (auth.uid())::text)
      AND role IS DISTINCT FROM 'admin'
    )
    OR public.is_admin()
  );

-- 14d) Halaman manajemen admin berhak mengubah role pengguna lain.
--      Trigger guard_profile_role memastikan hanya admin utama yang lolos.
DROP POLICY IF EXISTS admin_update_all ON public.profiles;
CREATE POLICY admin_update_all ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 15) Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- 16) Kolom pencatat waktu password terakhir diganti + RPC pembersih flag
--     'wajib ganti password'. Dipanggil dari halaman Ganti Password.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;

CREATE OR REPLACE FUNCTION public.mark_password_changed()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid text := (auth.uid())::text;
  v_rows integer := 0;
BEGIN
  IF v_uid IS NULL OR v_uid = '' THEN
    RETURN jsonb_build_object('success', false, 'rows', 0, 'error', 'not authenticated');
  END IF;

  UPDATE public.profiles
     SET must_change_password = false,
         password_changed_at = now(),
         updated_at = now()
   WHERE auth_uid = v_uid OR id = v_uid;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN jsonb_build_object('success', v_rows > 0, 'rows', v_rows);
END;
$$;

REVOKE ALL ON FUNCTION public.mark_password_changed() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.mark_password_changed() TO authenticated;
NOTIFY pgrst, 'reload schema';

-- 17) RPC: leaderboard nasional (sumber nilai tunggal = utbk_scores).
--     Parameter p_type dipertahankan untuk kompatibilitas signature, namun
--     diabaikan (filter tipe tryout sudah tidak relevan). Peringkat = skor
--     total terbaik per user.
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_type text DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE result JSONB;
BEGIN
  WITH ranked AS (
    SELECT DISTINCT ON (s.user_id::text)
      s.id, s.user_id, s.user_id AS student_id, s.total_score,
      CASE
        WHEN s.total_score >= 710 THEN 'Sangat Baik'
        WHEN s.total_score >= 660 THEN 'Baik'
        WHEN s.total_score >= 600 THEN 'Cukup'
        ELSE 'Kurang'
      END AS predicate,
      s.created_at, COALESCE(s.label, 'Input Nilai UTBK') AS tryout_name,
      ''::text AS tryout_type, s.recorded_on::text AS tryout_date, s.scores,
      jsonb_build_object(
        'full_name', p.full_name,
        'nisn', p.nisn,
        'school', p.school,
        'email', p.email
      ) AS profiles
    FROM public.utbk_scores s
    LEFT JOIN public.profiles p
      ON p.id::text = s.user_id::text OR p.auth_uid::text = s.user_id::text
    ORDER BY s.user_id::text, s.total_score DESC
  )
  SELECT jsonb_agg(sub) INTO result FROM (SELECT * FROM ranked ORDER BY total_score DESC) sub;
  RETURN COALESCE(result, '[]'::JSONB);
END;
$$;

-- 18) Tabel riwayat input nilai Tryout UTBK mandiri (form di Dashboard).
--     Menyimpan skor total + rincian 7 subtes (jsonb) per user.
CREATE TABLE IF NOT EXISTS public.utbk_scores (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score DOUBLE PRECISION NOT NULL CHECK (total_score >= 0 AND total_score <= 1000),
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  label TEXT,
  recorded_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS utbk_scores_user_id_idx ON public.utbk_scores (user_id);
CREATE INDEX IF NOT EXISTS utbk_scores_user_recorded_idx ON public.utbk_scores (user_id, recorded_on DESC);

ALTER TABLE public.utbk_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS own_select ON public.utbk_scores;
CREATE POLICY own_select ON public.utbk_scores FOR SELECT USING ((user_id)::text = (auth.uid())::text);
DROP POLICY IF EXISTS own_insert ON public.utbk_scores;
CREATE POLICY own_insert ON public.utbk_scores FOR INSERT WITH CHECK ((user_id)::text = (auth.uid())::text);
DROP POLICY IF EXISTS own_update ON public.utbk_scores;
CREATE POLICY own_update ON public.utbk_scores FOR UPDATE USING ((user_id)::text = (auth.uid())::text) WITH CHECK ((user_id)::text = (auth.uid())::text);
DROP POLICY IF EXISTS own_delete ON public.utbk_scores;
CREATE POLICY own_delete ON public.utbk_scores FOR DELETE USING ((user_id)::text = (auth.uid())::text);
DROP POLICY IF EXISTS admin_select_all ON public.utbk_scores;
CREATE POLICY admin_select_all ON public.utbk_scores FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS admin_all ON public.utbk_scores;
CREATE POLICY admin_all ON public.utbk_scores FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 19) Bank soal Tes Penjurusan (Minat & Bakat).
--     Setiap opsi dipetakan ke rumpun (Saintek/Soshum/Campuran) dan punya
--     bobot per jawaban 1-5 (weight_a..d): makin besar, makin kuat sinyal
--     rumpun dari jawaban tsb. Skor rumpun = akumulasi bobot jawaban yang
--     dipilih; selisih top-2 <= 10% total dianggap Campuran.
CREATE TABLE IF NOT EXISTS public.penjurusan_questions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  cluster_a TEXT NOT NULL DEFAULT 'Campuran',
  cluster_b TEXT NOT NULL DEFAULT 'Campuran',
  cluster_c TEXT NOT NULL DEFAULT 'Campuran',
  cluster_d TEXT NOT NULL DEFAULT 'Campuran',
  weight_a INTEGER NOT NULL DEFAULT 1 CHECK (weight_a BETWEEN 1 AND 5),
  weight_b INTEGER NOT NULL DEFAULT 1 CHECK (weight_b BETWEEN 1 AND 5),
  weight_c INTEGER NOT NULL DEFAULT 1 CHECK (weight_c BETWEEN 1 AND 5),
  weight_d INTEGER NOT NULL DEFAULT 1 CHECK (weight_d BETWEEN 1 AND 5),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pastikan kolom bobot per jawaban tersedia pada instalasi lama.
ALTER TABLE public.penjurusan_questions
  ADD COLUMN IF NOT EXISTS weight_a INTEGER NOT NULL DEFAULT 1 CHECK (weight_a BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS weight_b INTEGER NOT NULL DEFAULT 1 CHECK (weight_b BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS weight_c INTEGER NOT NULL DEFAULT 1 CHECK (weight_c BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS weight_d INTEGER NOT NULL DEFAULT 1 CHECK (weight_d BETWEEN 1 AND 5);

ALTER TABLE public.penjurusan_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS penjurusan_questions_select_all ON public.penjurusan_questions;
CREATE POLICY penjurusan_questions_select_all ON public.penjurusan_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS penjurusan_questions_admin_write ON public.penjurusan_questions;
CREATE POLICY penjurusan_questions_admin_write ON public.penjurusan_questions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 20) Riwayat login (lokasi + IP + perangkat). Diisi oleh Edge Function
--     'record-login' memakai service role. Tidak ada policy INSERT untuk
--     authenticated agar klien tidak dapat memalsukan data.
--     Hanya admin utama (is_super_admin) yang dapat melihat riwayat seluruh
--     akun; tiap pengguna tetap bisa melihat riwayat miliknya sendiri.
CREATE TABLE IF NOT EXISTS public.login_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_events_user_idx ON public.login_events (user_id, created_at DESC);

ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS login_events_select_own ON public.login_events;
CREATE POLICY login_events_select_own ON public.login_events
  FOR SELECT USING ((user_id)::text = (auth.uid())::text);

DROP POLICY IF EXISTS login_events_select_admin ON public.login_events;
CREATE POLICY login_events_select_admin ON public.login_events
  FOR SELECT USING (public.is_super_admin());

NOTIFY pgrst, 'reload schema';
`;

