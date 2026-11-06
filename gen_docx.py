import zipfile, xml.etree.ElementTree as ET, os, io

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'DOKUMENTASI_TEKNOLOGI.docx')

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
CT = 'http://schemas.openxmlformats.org/package/2006/content-types'
PKG = 'http://schemas.openxmlformats.org/package/2006/relationships'

def qn(tag):
    pfx, local = tag.split(':')
    ns = {'w': W, 'r': R}[pfx]
    return '{%s}%s' % (ns, local)

def make_content_types():
    root = ET.Element('{%s}Types' % CT)
    for ext, ct in [('rels','application/vnd.openxmlformats-package.relationships+xml'),
                    ('xml','application/xml')]:
        d = ET.SubElement(root, '{%s}Default' % CT)
        d.set('Extension', ext)
        d.set('ContentType', ct)
    ov = ET.SubElement(root, '{%s}Override' % CT)
    ov.set('PartName', '/word/document.xml')
    ov.set('ContentType', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml')
    return ET.tostring(root, encoding='unicode', xml_declaration=True)

def make_pkg_rels():
    root = ET.Element('{%s}Relationships' % PKG)
    rel = ET.SubElement(root, '{%s}Relationship' % PKG)
    rel.set('Id', 'rId1')
    rel.set('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument')
    rel.set('Target', 'word/document.xml')
    return ET.tostring(root, encoding='unicode', xml_declaration=True)

def make_word_rels():
    root = ET.Element('{%s}Relationships' % PKG)
    for rid, target in [('rId1','styles.xml'),('rId2','numbering.xml')]:
        rel = ET.SubElement(root, '{%s}Relationship' % PKG)
        rel.set('Id', rid)
        rel.set('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/' + target.replace('.xml',''))
        rel.set('Target', target)
    return ET.tostring(root, encoding='unicode', xml_declaration=True)

def p(text, style=None, bold=False, size=None):
    elem = ET.Element(qn('w:p'))
    if style:
        pPr = ET.SubElement(elem, qn('w:pPr'))
        pStyle = ET.SubElement(pPr, qn('w:pStyle'))
        pStyle.set(qn('w:val'), style)
    run = ET.SubElement(elem, qn('w:r'))
    if bold or size:
        rPr = ET.SubElement(run, qn('w:rPr'))
        if bold:
            ET.SubElement(rPr, qn('w:b'))
        if size:
            sz = ET.SubElement(rPr, qn('w:sz'))
            sz.set(qn('w:val'), str(size))
    t = ET.SubElement(run, qn('w:t'))
    t.text = text
    t.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    return elem

def heading(text, level=1):
    styles = {1:'Heading1', 2:'Heading2', 3:'Heading3'}
    return p(text, style=styles.get(level,'Heading1'))

def bullet(text):
    elem = p(text)
    pPr = elem.find(qn('w:pPr'))
    if pPr is None:
        pPr = ET.SubElement(elem, qn('w:pPr'))
        elem.remove(elem.find(qn('w:r')))
        elem.insert(0, pPr)
        run = ET.SubElement(elem, qn('w:r'))
        t = ET.SubElement(run, qn('w:t'))
        t.text = text
        t.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    numPr = ET.SubElement(pPr, qn('w:numPr'))
    ilvl = ET.SubElement(numPr, qn('w:ilvl'))
    ilvl.set(qn('w:val'), '0')
    numId = ET.SubElement(numPr, qn('w:numId'))
    numId.set(qn('w:val'), '1')
    return elem

body = ET.Element(qn('w:body'))

body.append(p('DOKUMENTASI TEKNOLOGI', style='Title'))
body.append(p('Arahku - Platform Penjurusan & Rekomendasi Kampus PTN'))
body.append(p(''))

body.append(heading('1. Ringkasan Proyek', 1))
body.append(p('Arahku adalah platform web berbasis Single Page Application (SPA) untuk membantu siswa menemukan jurusan dan kampus PTN yang cocok. Aplikasi ini menyediakan tes penjurusan minat, rekomendasi program studi dan kampus alternatif, analisis passing grade, serta gap analysis kompetensi per subtes UTBK SNBT.'))
body.append(p(''))
body.append(heading('Stack Teknologi Utama', 2))
for item in [
    'Frontend: React 19 + TypeScript 5.8 + Vite 6',
    'Styling: Tailwind CSS v4 (CSS-first) + shadcn/ui base-nova + Base UI',
    'Backend / Database: Supabase (PostgreSQL + PostgREST + Auth)',
    'State Management: Custom Observable Store (tanpa Redux/Zustand)',
    'Export: jsPDF + jspdf-autotable (PDF), SheetJS/XLSX (Excel)',
    'Alerts: SweetAlert2',
    'Animations: tw-animate-css (CSS-based)',
    'Deployment: Vercel (static SPA)',
    'Icons: Lucide React',
    'Font: Public Sans (Google Fonts)',
]:
    body.append(bullet(item))
body.append(p(''))

body.append(heading('2. Arsitektur Frontend', 1))
body.append(heading('2.1 React 19 & TypeScript 5.8', 2))
body.append(p('Aplikasi menggunakan React 19 dengan JSX transform otomatis (react-jsx). TypeScript dikonfigurasi dengan target ES2022, moduleResolution bundler, dan path alias @/* yang mengarah ke ./src/*. Tipe domain didefinisikan di src/types.ts mencakup Profile, Institution, Major, Competency, Tryout, TryoutResult, GapAnalysisItem, dll.'))
body.append(p(''))
body.append(heading('2.2 Vite 6 sebagai Build Tool', 2))
body.append(p('Vite digunakan sebagai dev server dan bundler. Konfigurasi di vite.config.ts mencakup:'))
for item in [
    'Plugin @vitejs/plugin-react untuk Fast Refresh',
    'Plugin @tailwindcss/vite untuk integrasi Tailwind v4 native',
    'Path alias @ -> ./src via resolve.alias',
    'HMR dapat dinonaktifkan via env DISABLE_HMR',
    'Dev server di port 3000 dengan host 0.0.0.0',
]:
    body.append(bullet(item))
body.append(p(''))
body.append(heading('2.3 Routing Manual (Tanpa Library)', 2))
body.append(p('Tidak ada react-router atau library routing lainnya. Navigasi diimplementasikan secara manual di App.tsx menggunakan state activeTab (string) dan switch statement di renderActiveView(). Setiap view di-code-split menggunakan React.lazy() melalui helper lazyView() dan dibungkus Suspense.'))
body.append(p('Konsekuensi: tidak ada URL path, tidak ada deep linking, tidak ada browser back/forward navigation. Refresh selalu kembali ke dashboard.'))
body.append(p(''))
body.append(heading('2.4 Code Splitting', 2))
body.append(p('20 view di-load secara lazy (React.lazy). Hanya AuthView yang di-import eagerly karena merupakan layar pre-auth. File jsPDF dan XLSX juga di-dynamic import di beberapa view agar tidak masuk bundle utama.'))
body.append(p(''))

body.append(heading('3. State Management', 1))
body.append(heading('3.1 Custom Observable Store', 2))
body.append(p('Aplikasi TIDAK menggunakan Redux, Zustand, Jotai, MobX, atau Context API untuk global state. Sebagai gantinya, terdapat class AppStore singleton (src/lib/store.ts) yang mengimplementasikan pola Observer/Subscribe-Notify secara manual.'))
body.append(p(''))
body.append(p('Mekanisme:'))
for item in [
    'AppStore menyimpan private state: AppState (14 field)',
    'Method subscribe(listener) mengembalikan unsubscribe function',
    'Method notify() memanggil semua listener yang terdaftar',
    'Hook useAppState() menggunakan useState + useEffect untuk subscribe ke store',
    'Setiap notify() memicu shallow copy state sehingga seluruh komponen re-render',
]:
    body.append(bullet(item))
body.append(p(''))
body.append(heading('3.2 Optimistic Updates', 2))
body.append(p('Setiap mutasi data (updateProfile, addTargetMajor, submitResult, admin CRUD) dilakukan secara optimistic: state lokal diubah dan notify() dipanggil terlebih dahulu, kemudian write ke Supabase dilakukan di dalam try/catch yang hanya console.warn jika gagal. UI tetap responsif meskipun backend belum merespons atau gagal.'))
body.append(p(''))
body.append(heading('3.3 Master Data Loading', 2))
body.append(p('fetchMasterData() memuat 6 tabel sekaligus saat init dan setelah auth: tryouts, institutions (limit 5000), majors (limit 10000 dengan join institutions), penjurusan_questions, tutoring_centers, competencies. Data kosong dari server tidak menimpa state lokal (guard: if data && data.length > 0).'))
body.append(p(''))

body.append(heading('4. UI & Design System', 1))
body.append(heading('4.1 shadcn/ui dengan Base UI', 2))
body.append(p('Komponen UI menggunakan shadcn/ui dengan style base-nova yang dibangun di atas @base-ui/react (bukan Radix UI). Konfigurasi di components.json menunjukkan cssVariables: true, baseColor: neutral, dan iconLibrary: lucide.'))
body.append(p('Terdapat 22 primitif UI di src/components/ui/, termasuk Button, Card, Dialog, DropdownMenu, Select, Tabs, Tooltip, Avatar, Badge, Progress, Table, Input, dll. Dua komponen custom ditambahkan: JenjangBadge (badge jenjang S1/D4/D3) dan Pagination.'))
body.append(p(''))
body.append(heading('4.2 Tailwind CSS v4 (CSS-First)', 2))
body.append(p('Tailwind CSS v4 dikonfigurasi sepenuhnya dalam CSS (tidak ada tailwind.config.js/ts). File src/index.css berisi:'))
for item in [
    '@import "tailwindcss" - core Tailwind v4',
    '@import "tw-animate-css" - animasi CSS untuk transisi view',
    '@import "shadcn/tailwind.css" - base styles shadcn',
    '@custom-variant dark - dark mode via class strategy',
    '@theme inline - mapping ~33 CSS custom properties ke Tailwind theme namespace',
]:
    body.append(bullet(item))
body.append(p(''))
body.append(heading('4.3 OKLCH Color Tokens', 2))
body.append(p('Seluruh color token menggunakan format oklch() yang merupakan color space modern dengan persepsi uniform. Palette utama: violet/indigo primary pada warm neutral base. Token mencakup --background, --foreground, --card, --primary, --secondary, --accent, --destructive, --border, --ring, --chart-1 s/d --chart-5, serta set lengkap untuk dark mode.'))
body.append(p('Radius scale diturunkan secara multiplikatif dari --radius: 0.625rem dengan faktor sm(0.6), md(0.8), lg(1.0), xl(1.4), 2xl(1.8), dst.'))
body.append(p(''))
body.append(heading('4.4 Typography & Dark Mode', 2))
body.append(p('Font utama: Public Sans (variable weight 300-900) dimuat via Google Fonts CDN di index.html. Dark mode dikontrol oleh state isDarkMode di App.tsx yang menambahkan class dark pada wrapper div dan html element, serta disimpan di localStorage.arahku_theme_dark.'))
body.append(p(''))

body.append(heading('5. Backend / Data Layer', 1))
body.append(heading('5.1 Supabase sebagai Backend-as-a-Service', 2))
body.append(p('Aplikasi menggunakan Supabase yang menyediakan PostgreSQL database, PostgREST API, dan Auth service. Tidak ada custom server/backend code - seluruh logika backend berjalan di Supabase (database functions/RPC) atau di client-side JavaScript.'))
body.append(p('Client SDK: @supabase/supabase-js v2.108.2, dikonfigurasi di src/lib/supabaseClient.ts dengan persistSession: true dan autoRefreshToken: true.'))
body.append(p(''))
body.append(heading('5.2 Kredensial & Koneksi', 2))
body.append(p('Resolusi kredensial Supabase (URL + anon key) memiliki prioritas:'))
for item in [
    '1. localStorage.supabase_url / supabase_anon_key (diatur via UI admin)',
    '2. Environment variable VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY',
    '3. Placeholder fallback',
]:
    body.append(bullet(item))
body.append(p('Karena localStorage mengambil prioritas, admin dapat mengarahkan aplikasi ke project Supabase mana pun melalui UI tanpa rebuild.'))
body.append(p(''))
body.append(heading('5.3 Authentication Flow', 2))
body.append(p('Auth mendukung dua metode login:'))
body.append(p('Email: signInWithPassword standar Supabase Auth.', bold=True))
body.append(p('NISN: Flow 4 langkah - RPC get_email_by_nisn untuk resolve email dari NISN, fallback ke nisn@peserta.com, signInWithPassword, dan retry path via sync_profile_auth_user + reset_password_by_nisn jika diperlukan.', bold=True))
body.append(p('Signup menggunakan signUp dengan metadata (full_name, nisn, school, role). Role dipilih user saat signup (peserta/admin) tanpa verifikasi server-side.'))
body.append(p('Session persistence ditangani oleh SDK Supabase. Listener onAuthStateChange terdaftar di AppStore constructor untuk sync profile dan master data saat login/logout.'))
body.append(p(''))
body.append(heading('5.4 Database Tables', 2))
body.append(p('10 tabel yang diakses oleh client code:'))
tables = [
    ('profiles', 'Data profil user (id, auth_uid, full_name, nisn, email, role, is_profile_complete, must_change_password)'),
    ('majors', 'Program studi (id, institution_id, code, name, cluster, jenjang, passing_grade_total, requirements)'),
    ('institutions', 'Institusi/kampus (id, name, abbreviation untuk pencarian singkatan, type PTN/PTS/Kedinasan, location, grade, range_min/max)'),
    ('utbk_scores', 'Riwayat input nilai tryout UTBK mandiri user (user_id, total_score, scores JSONB 7 subtes, label, recorded_on) — sumber nilai tunggal menggantikan tryout_results yang telah dihapus'),
    ('login_events', 'Riwayat login user (user_id, ip, city, region, country, user_agent, created_at) — diisi Edge Function record-login via service role, dibaca admin utama/pemilik akun'),
    ('target_institutions', 'Target prodi pilihan user (user_id, major_id, priority)'),
    ('tryouts', 'Definisi tryout (name, date, type, duration_minutes, question_count, status)'),
    ('penjurusan_questions', 'Bank soal tes penjurusan (question, option_a-d, cluster_a-d, weight_a-d bobot per-jawaban 1-5, is_active)'),
    ('competencies', 'Daftar kompetensi/subtes (code PU/PPU/PBM/PK/LBI/LBE/PM, name, weight)'),
    ('tutoring_centers', 'Rekomendasi bimbel (name, focus_competency_code, link_url, rating)'),
]
for tname, tdesc in tables:
    body.append(bullet('%s: %s' % (tname, tdesc)))
body.append(p(''))
body.append(heading('5.5 RPC (Stored Functions)', 2))
body.append(p('6 RPC dipanggil dari client code:'))
rpcs = [
    'search_majors - Server-side search prodi dengan filter jenjang/rumpun/sort/pagination',
    'stats_majors - Agregat statistik prodi (total universitas, prodi, breakdown jenjang/cluster)',
    'popular_majors - Prodi terpopuler dengan limit parameter',
    'get_leaderboard - Leaderboard nasional skor terbaik per user; kini membaca tabel utbk_scores (param p_type dipertahankan namun diabaikan)',
    'get_email_by_nisn - Resolve email dari NISN (SECURITY DEFINER)',
    'sync_profile_auth_user - Sinkronisasi profil CSV ke auth.users (SECURITY DEFINER)',
]
for rpc in rpcs:
    body.append(bullet(rpc))
body.append(p('Catatan: search_majors, stats_majors, dan popular_majors dipanggil oleh aplikasi namun definisi SQL-nya tidak tersimpan di repository. Fungsi-fungsi ini harus sudah ada di project Supabase target.'))
body.append(p(''))
body.append(heading('5.6 Scoring Engine', 2))
body.append(p('Perhitungan skor tryout dilakukan di client-side (store.ts submitResult):'))
for item in [
    'Weighted average dari 7 subtes (PU, PPU, PBM, PK, LBI, LBE, PM) menggunakan bobot dari tabel competencies',
    'Predicate thresholds: >= 710 Sangat Baik, >= 660 Baik, >= 600 Cukup, < 600 Kurang',
    'Sejak pembaruan sumber nilai tunggal, hasil tryout TIDAK lagi disimpan/direkam (tidak insert ke tryout_results); modal "Kerjakan Tryout" hanya menghitung & menampilkan skor sesaat',
] :
    body.append(bullet(item))
body.append(p(''))
body.append(heading('5.7 Gap Analysis & Recommendation Engine', 2))
body.append(p('getAnalysis() di store.ts melakukan analisis murni client-side dengan sumber nilai tunggal dari tabel utbk_scores (input "Input Nilai UTBK" terbaru di Dashboard):'))
for item in [
    'Membandingkan skor UTBK user dengan passing grade target major',
    'Per-competency gap classification: Aman (gap >= 0), Defisit (gap < 0), Kritis (gap < -50)',
    'Menghasilkan hingga 6 alternative majors yang passing grade-nya terjangkau, di-boost jika cluster sesuai minat user',
    'Sorting: match score -> closest gap -> alphabetical name',
] :
    body.append(bullet(item))
body.append(p(''))

body.append(heading('5.8 Input Nilai UTBK Mandiri (Dashboard)', 2))
body.append(p('User dapat menginput skor tryout UTBK terakhirnya sendiri langsung dari Dashboard (total + rincian 7 subtes). Data disimpan permanen ke tabel utbk_scores:'))
for item in [
    'addUtbkScore - Insert nilai baru ke riwayat (optimistic update, di-rollback bila insert gagal)',
    'updateUtbkScore - Memperbarui entri riwayat yang ada',
    'deleteUtbkScore - Menghapus entri riwayat',
    'syncFromSupabase memuat ulang utbk_scores saat login, sehingga riwayat tetap tampil setiap dashboard dibuka',
    'Dashboard merender rekap (skor terakhir, tertinggi, rata-rata, perubahan) dan grafik perkembangan memakai SVG line chart (tanpa library chart eksternal)',
]:
    body.append(bullet(item))
body.append(p(''))

body.append(heading('5.9 Tes Penjurusan (Minat & Bakat) Berbobot', 2))
body.append(p('Tes penjurusan di BingungView.tsx memetakan tiap opsi jawaban ke rumpun (Saintek/Soshum/Campuran) dengan bobot per jawaban 1-5 (kolom weight_a-d pada penjurusan_questions):'))
for item in [
    'Skor rumpun = akumulasi bobot jawaban yang dipilih (weighted tally), bukan sekadar jumlah jawaban',
    'Rumpun dominan = skor tertinggi; namun bila selisih skor tertinggi & kedua <= 10% total skor, hasil dianggap seimbang (Campuran)',
    'Bar hasil menampilkan persentase ternormalisasi = skor rumpun / total bobot terjawab x 100 (plus jumlah poin)',
    'Admin dapat mengubah bobot tiap jawaban (1-5) langsung dari tabel Bank Soal Penjurusan (AdminQuestionsView) maupun saat menambah soal',
    'Pencarian kampus di seluruh aplikasi mendukung singkatan (kolom institutions.abbreviation) melalui helper institutionSearch + komponen CampusCombobox',
]:
    body.append(bullet(item))
body.append(p(''))

body.append(heading('5.10 Riwayat Login & Kontrol Akses Admin Utama', 2))
body.append(p('Setiap kali user benar-benar login (event SIGNED_IN), AppStore memanggil Edge Function record-login yang mencatat IP, lokasi (kota/provinsi/negara via lookup IP), user-agent, dan waktu ke tabel login_events. Riwayat ditampilkan per pengguna lewat dialog LoginHistoryDialog pada halaman Daftar Pengguna (AdminUsersView).'))
for item in [
    'revoke-sessions (Edge Function, verify_jwt) - admin utama membatalkan semua sesi/refresh token akun target via RPC force_logout_user; memaksa user login ulang di semua device',
    'login_events_select_own - tiap pengguna dapat melihat riwayat login miliknya sendiri',
    'login_events_select_admin - hanya admin utama (is_super_admin) yang dapat melihat riwayat seluruh akun',
    'is_super_admin() - helper yang mengunci aksi sensitif ke satu akun admin utama (hardcode auth uid admin1)',
    'guard_profile_role() - perubahan kolom role hanya boleh dilakukan admin utama; pelanggaran memunculkan error 42501 (bukan dibatalkan senyap)',
    'UI Daftar Pengguna menyembunyikan tombol Riwayat dan ubah peran (Jadikan/Turunkan Admin) bagi admin non-utama',
]:
    body.append(bullet(item))
body.append(p(''))

body.append(heading('6. Fitur Export', 1))
body.append(heading('6.1 PDF Export (jsPDF + autoTable)', 2))
body.append(p('Dua fungsi export PDF di src/lib/exportUtils.ts:'))
for item in [
    'exportResultsPDF - Laporan hasil tryout dengan header branded, tabel 6 kolom semua hasil',
    'exportAnalysisPDF - Analisis passing grade dengan status LULUS/BELUM MEMENUHI berwarna, tabel gap per kompetensi',
]:
    body.append(bullet(item))
body.append(p('Di beberapa view (TryoutsView), jsPDF di-dynamic import agar tidak masuk bundle utama. ReportsView mengimport secara statis.'))
body.append(p(''))
body.append(heading('6.2 Excel Export/Import (SheetJS/XLSX)', 2))
body.append(p('exportResultsExcel menghasilkan file .xlsx dengan sheet Hasil Tryout berisi 7 kolom subtes terpisah. XLSX juga digunakan untuk bulk import prodi di AdminMajorsView (upload spreadsheet, parse, bulk insert ke Supabase).'))
body.append(p(''))

body.append(heading('7. Visualisasi & Feedback', 1))
body.append(heading('7.1 SweetAlert2', 2))
body.append(p('Digunakan sebagai mekanisme feedback utama untuk error, konfirmasi, dan success message di 7 file (AuthView, BingungView, ChangePasswordView, SupabaseSqlView, AdminUsersView, AdminResultsView, DashboardView). Error message diproses melalui helper getErrorMessage() yang menerjemahkan error Supabase/auth ke Bahasa Indonesia.'))
body.append(p(''))
body.append(heading('7.2 Animasi CSS', 2))
body.append(p('Seluruh animasi menggunakan tw-animate-css (CSS-based), bukan Framer Motion (package motion terinstall tapi tidak pernah di-import). Pola yang digunakan:'))
for item in [
    'View transitions: animate-in fade-in duration-300 di setiap view root',
    'Micro-interactions: transition-all, transition-colors, transition-transform',
    'Sidebar slide: transition-transform duration-300 dengan translate-x',
    'Loading spinner: animate-spin',
    'Status pulse: animate-pulse pada indikator koneksi Supabase',
    'Backdrop blur: bg-card/80 backdrop-blur-md pada sticky navbar',
]:
    body.append(bullet(item))
body.append(p(''))

body.append(heading('8. Struktur Direktori src/', 1))
dirs = [
    ('src/main.tsx', 'Entry point React (createRoot + StrictMode)'),
    ('src/App.tsx', 'Root component, manual router, auth gating, dark mode, layout shell'),
    ('src/types.ts', 'Semua interface domain (Profile, Institution, Major, Competency, Tryout, dll)'),
    ('src/index.css', 'Tailwind v4 config, OKLCH tokens, dark mode variant, radius scale'),
    ('src/lib/store.ts', 'AppStore singleton (910 baris) - global state, Supabase sync, scoring engine, gap analysis, admin CRUD'),
    ('src/lib/supabaseClient.ts', 'Factory client Supabase dengan resolusi kredensial bertingkat'),
    ('src/lib/prodiSearch.ts', 'Server-side search layer via RPC (search_majors, stats_majors, popular_majors) + debounce hook'),
    ('src/lib/exportUtils.ts', 'PDF dan Excel export utilities'),
    ('src/lib/mockData.ts', 'Seed data default + SUPABASE_SQL_BLUEPRINT (DDL/RPC template)'),
    ('src/lib/utils.ts', 'Helper cn() (clsx + tailwind-merge), getErrorMessage(), formatNumber()'),
    ('src/components/ui/', '22 shadcn/ui primitives + 2 custom (JenjangBadge, Pagination)'),
    ('src/components/layout/', 'App chrome: Navbar, Sidebar (menu definition + role-based sections), Footer'),
    ('src/components/modals/', 'TakeTryoutModal (simulasi ujian), SupabaseSqlModal (SQL blueprint viewer)'),
    ('src/components/views/', '14 participant views + 6 admin views, semuanya code-split via React.lazy'),
]
for path, desc in dirs:
    body.append(bullet('%s - %s' % (path, desc)))
body.append(p(''))

body.append(heading('9. Konfigurasi Build & Environment', 1))
body.append(heading('9.1 tsconfig.json', 2))
for item in [
    'target: ES2022',
    'module: ESNext, moduleResolution: bundler',
    'jsx: react-jsx (automatic runtime)',
    'paths: @/* -> ./src/*',
    'allowImportingTsExtensions: true',
    'noEmit: true (TypeScript hanya untuk type checking, bukan emit)',
    'Lint command: tsc --noEmit',
]:
    body.append(bullet(item))
body.append(p(''))
body.append(heading('9.2 Environment Variables', 2))
body.append(p('File .env.example mendeklarasikan 5 variabel, namun hanya 2 yang benar-benar dibaca aplikasi:'))
for item in [
    'VITE_SUPABASE_URL - URL project Supabase (dibaca di supabaseClient.ts dan store.ts)',
    'VITE_SUPABASE_ANON_KEY - Anon key Supabase (dibaca di supabaseClient.ts)',
    'GEMINI_API_KEY - Dideklarasikan tapi TIDAK digunakan (dependency @google/genai tidak di-import)',
    'APP_URL - Dideklarasikan tapi TIDAK digunakan',
    'DISABLE_HMR - Toggle HMR/file watching di vite.config.ts',
]:
    body.append(bullet(item))
body.append(p('Variabel VITE_* di-bake ke client bundle saat build time dan bersifat publik. localStorage mengambil prioritas di atas env vars, sehingga env vars berfungsi sebagai build-time default saja.'))
body.append(p(''))
body.append(heading('9.3 NPM Scripts', 2))
scripts = [
    'npm run dev - Vite dev server di port 3000, host 0.0.0.0',
    'npm run build - Production build via Vite',
    'npm run preview - Preview production build',
    'npm run lint - Type checking via tsc --noEmit',
    'npm run clean - Hapus dist/ dan server.js (vestigial)',
]
for s in scripts:
    body.append(bullet(s))
body.append(p(''))
body.append(heading('9.4 Deployment', 2))
body.append(p('Aplikasi di-deploy sebagai static SPA ke Vercel. Folder .vercel/project.json menunjukkan konfigurasi project. Output build (dist/) berisi file-file statis yang telah di-code-split per view.'))

doc_xml = ET.Element(qn('w:document'))
doc_xml.set('xmlns:w', W)
doc_xml.set('xmlns:r', R)
doc_xml.append(body)
doc_str = ET.tostring(doc_xml, encoding='unicode', xml_declaration=True)

styles_xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:jc w:val="center"/><w:spacing w:after="200"/></w:pPr><w:rPr><w:b/><w:sz w:val="52"/><w:szCs w:val="52"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:spacing w:before="360" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/><w:szCs w:val="36"/><w:color w:val="1a1a2e"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:spacing w:before="240" w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/><w:color w:val="2d2d5e"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:pPr><w:spacing w:before="200" w:after="60"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/><w:color w:val="3d3d7e"/></w:rPr></w:style></w:styles>'

numbering_xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="\u2022"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>'

buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.writestr('[Content_Types].xml', make_content_types())
    zf.writestr('_rels/.rels', make_pkg_rels())
    zf.writestr('word/document.xml', doc_str)
    zf.writestr('word/styles.xml', styles_xml)
    zf.writestr('word/numbering.xml', numbering_xml)
    zf.writestr('word/_rels/document.xml.rels', make_word_rels())

with open(OUT, 'wb') as f:
    f.write(buf.getvalue())

size_kb = os.path.getsize(OUT) / 1024
print('OK: %s (%.1f KB)' % (OUT, size_kb))