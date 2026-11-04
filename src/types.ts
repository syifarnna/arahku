export type ClusterType = 'Saintek' | 'Soshum' | 'Campuran';
export type InstitutionType = 'PTN' | 'PTS' | 'Kedinasan';

export interface Profile {
  id: string;
  full_name: string;
  nisn: string;
  email: string;
  phone: string;
  school: string;
  major_interest: ClusterType | null;
  avatar_url?: string;
  role?: 'admin' | 'peserta';
  is_profile_complete?: boolean;
  must_change_password?: boolean;
  password_changed_at?: string;
  updated_at: string;
}

export interface Institution {
  id: number;
  name: string;
  abbreviation?: string; // singkatan populer, boleh beberapa dipisah koma (mis. "ITB")
  type: InstitutionType;
  logo?: string;
  grade?: number;      // Grade Campus: batas nilai/nilai minimum masuk kampus
  range_min?: number;  // Range Nilai bawah (nilai tryout terendah prodi di kampus)
  range_max?: number;  // Range Nilai atas
}

export interface PenjurusanQuestion {
  id: number;
  question: string;
  option_a: string;
  cluster_a: ClusterType;
  // Bobot per jawaban (1-5): semakin besar, semakin kuat sinyal rumpun dari opsi tsb.
  weight_a: number;
  option_b: string;
  cluster_b: ClusterType;
  weight_b: number;
  option_c: string;
  cluster_c: ClusterType;
  weight_c: number;
  option_d: string;
  cluster_d: ClusterType;
  weight_d: number;
  // Deprecated: bobot per soal tidak dipakai untuk skor. Dipertahankan agar
  // kompatibel dengan kolom di database.
  weight?: number;
  is_active: boolean;
  created_at?: string;
}

export interface TutoringCenter {
  id: number;
  name: string;
  focus_competency_code?: string;
  contact_info?: string;
  link_url?: string;
  description?: string;
  rating?: number;
  price?: string;
}

export interface PenjurusanResult {
  dominantCluster: ClusterType;
  totalSaintek: number;
  totalSoshum: number;
  totalCampuran: number;
  answeredAt: string;
  recommendedMajorIds: number[];
}

export interface Major {
  id: number;
  institution_id: number;
  institution_name?: string;
  institution_type?: InstitutionType;
  code?: string;
  name: string;
  cluster: ClusterType;
  jenjang?: 'S1' | 'D-III' | 'D-IV';
  daya_tampung?: number;
  peminat?: number;
  passing_grade_total: number; // e.g. 685.5
  passing_grade_percentage?: number; // e.g. 68.55
  year?: number;
  requirements?: Record<string, number>; // min score per competency code e.g. { PU: 650, PK: 700 }
}

export interface Competency {
  id: number;
  code: string; // PU, PPU, PBM, PK, LBI, LBE, PM
  name: string;
  description: string;
  weight: number;
}

export interface Tryout {
  id: number;
  name: string;
  date: string;
  type: 'UTBK SNBT' | 'Ujian Mandiri' | 'Ujian Kedinasan';
  duration_minutes: number;
  question_count: number;
  status: 'Tersedia' | 'Selesai' | 'Segera';
  description?: string;
}

export interface TryoutResult {
  id: number;
  user_id?: string;
  student_id: string;
  tryout_id: number;
  tryout_name: string;
  tryout_type: string;
  tryout_date: string;
  total_score: number;
  predicate: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang';
  created_at: string;
  scores: Record<string, number>; // { PU: 710, PK: 640, ... }
}

export interface UtbkScore {
  id: number;
  user_id?: string;
  total_score: number;
  scores: Record<string, number>; // { PU: 710, PPU: 680, ... } — rincian 7 subtes
  label?: string | null;
  recorded_on: string; // ISO date (YYYY-MM-DD)
  created_at: string;
}

export interface LoginEvent {
  id: number;
  user_id: string;
  ip?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  id: number;
  user_id: string;
  student_id: string;
  total_score: number;
  predicate: string;
  created_at: string;
  tryout_name: string;
  tryout_type: string;
  tryout_date: string;
  scores: Record<string, number>;
  profiles: {
    full_name: string;
    nisn: string;
    school: string;
    email: string;
  };
}

export interface TargetInstitution {
  id: number;
  student_id: string;
  major_id: number;
  major: Major;
  priority: number; // 1, 2, 3...
}

export interface GapAnalysisItem {
  competency_code: string;
  competency_name: string;
  student_score: number;
  min_required: number;
  gap: number;
  status: 'Aman' | 'Defisit' | 'Kritis';
}

export interface AnalysisSummary {
  target_major: Major;
  latest_result: TryoutResult;
  is_passed_total: boolean;
  total_gap: number;
  gaps: GapAnalysisItem[];
  weakest_competency: GapAnalysisItem | null;
  alternative_majors: Array<Major & { chance_percentage: number; gap_diff: number }>;
}
