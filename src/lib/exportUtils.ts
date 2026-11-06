import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AnalysisSummary, TryoutResult } from '../types';

export function exportResultsPDF(results: TryoutResult[], studentName: string) {
  const doc = new jsPDF();
  
  // Brand Header
  doc.setFillColor(255, 107, 107); // #FF6B6B
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Arahku - Laporan Resmi Hasil UTBK', 14, 18);

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama Peserta: ${studentName}`, 14, 38);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`, 14, 45);

  const tableData = results.map((r, idx) => [
    idx + 1,
    r.tryout_name,
    r.tryout_type,
    new Date(r.created_at).toLocaleDateString('id-ID'),
    r.total_score.toFixed(1),
    r.predicate
  ]);

  autoTable(doc, {
    startY: 52,
    head: [['No', 'Nama Simulasi Tryout', 'Jenis', 'Tanggal', 'Skor Total', 'Predikat']],
    body: tableData,
    headStyles: { fillColor: [105, 108, 255], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 249, 255] },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  doc.save(`Laporan_Tryout_${studentName.replace(/\s+/g, '_')}.pdf`);
}

export function exportAnalysisPDF(summary: AnalysisSummary, studentName: string) {
  const doc = new jsPDF();
  
  doc.setFillColor(105, 108, 255);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Arahku - Analisis Kelulusan Passing Grade', 14, 18);

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(11);
  doc.text(`Peserta: ${studentName}`, 14, 38);
  doc.text(`Target Pilihan: ${summary.target_major.name} (${summary.target_major.institution_name})`, 14, 45);
  doc.text(`Passing Grade Target: ${summary.target_major.passing_grade_total} | Skor Siswa: ${summary.latest_result.total_score}`, 14, 52);
  
  doc.setFont('helvetica', 'bold');
  if (summary.is_passed_total) {
    doc.setTextColor(34, 197, 94); // emerald
    doc.text('STATUS: MEMENUHI PASSING GRADE (LULUS)', 14, 60);
  } else {
    doc.setTextColor(239, 68, 68); // rose
    doc.text(`STATUS: BELUM MEMENUHI (GAP ${summary.total_gap > 0 ? '+' : ''}${summary.total_gap})`, 14, 60);
  }

  const compData = summary.gaps.map(g => [
    g.competency_code,
    g.competency_name,
    g.student_score,
    g.min_required,
    `${g.gap > 0 ? '+' : ''}${g.gap}`,
    g.status
  ]);

  autoTable(doc, {
    startY: 68,
    head: [['Kode', 'Subtes Kompetensi', 'Skor Siswa', 'Min Syarat', 'Selisih (Gap)', 'Status Subtes']],
    body: compData,
    headStyles: { fillColor: [43, 44, 64], textColor: 255, fontStyle: 'bold' }
  });

  doc.save(`Analisis_PassingGrade_${studentName.replace(/\s+/g, '_')}.pdf`);
}

export function exportResultsExcel(results: TryoutResult[], studentName: string) {
  const sheetData = results.map(r => ({
    'ID Tryout': r.tryout_id,
    'Nama Tryout': r.tryout_name,
    'Jenis': r.tryout_type,
    'Tanggal Pelaksanaan': r.tryout_date,
    'Skor Total (IRT)': r.total_score,
    'Predikat': r.predicate,
    'PU (Penalaran Umum)': r.scores.PU || 0,
    'PPU (Pengetahuan Pemahaman)': r.scores.PPU || 0,
    'PBM (Memahami Bacaan)': r.scores.PBM || 0,
    'PK (Kuantitatif)': r.scores.PK || 0,
    'LBI (Literasi Indo)': r.scores.LBI || 0,
    'LBE (Literasi Inggris)': r.scores.LBE || 0,
    'PM (Penalaran Matematika)': r.scores.PM || 0
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hasil Tryout');
  XLSX.writeFile(workbook, `Rekap_Nilai_Tryout_${studentName.replace(/\s+/g, '_')}.xlsx`);
}
