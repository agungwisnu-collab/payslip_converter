export interface RuleMapping {
  inputHeader: string;
  outputCode: string;
  priority?: 'high' | 'default';
  partialMatch?: boolean;
  note?: string;
}

export const RULES: RuleMapping[] = [
  { inputHeader: 'GP NEW', outputCode: 'BASIC', priority: 'default', note: 'Fallback jika TOTAL GAJI PROPORSIONAL ≤ 0 atau tidak valid' },
  { inputHeader: 'TOTAL GAJI PROPORSIONAL', outputCode: 'BASIC', priority: 'high', note: 'High Priority dibanding GP New' },
  { inputHeader: 'T. JABATAN', outputCode: 'ALW1' },
  { inputHeader: 'T. KEHADIRAN', outputCode: 'ALW2' },
  { inputHeader: 'T. PROFESI', outputCode: 'ALW3' },
  { inputHeader: 'T. CASTING', outputCode: 'ALW6' },
  { inputHeader: 'T. PENUGASAN', outputCode: 'ALW7' },
  { inputHeader: 'T. BEBAN KERJA', outputCode: 'PPH21_TER_ALW' },
  { inputHeader: 'U. SEWA KEND', outputCode: 'SWM' },
  { inputHeader: 'KEKURANGAN GAJI', outputCode: 'ADJ' },
  { inputHeader: 'REIMBURSEMENT KESEHATAN', outputCode: 'AET' },
  { inputHeader: 'LEMBUR', outputCode: 'OVT_ALW' },
  { inputHeader: 'BONUS SALES (Rp)', outputCode: 'BONUS' },
  { inputHeader: 'KEBIJAKAN CEO', outputCode: 'CEO' },
  { inputHeader: 'CICILAN PINJAMAN', outputCode: 'LOAN_DED' },
  { inputHeader: 'POTONGAN ABSEN KEHDRAN & PROFESI', outputCode: 'ABS_PROF' },
  { inputHeader: 'BPJS KESEHATAN', outputCode: 'BPJS_KES_EMP' },
  { inputHeader: 'BPJS TK PPU', outputCode: 'BPTK' },
  { inputHeader: 'BPJS TK BPU ( KHUSUS CS KEMITRAAN)', outputCode: 'BPTK', note: 'Sama kode dengan PPU — mutually exclusive' },
  { inputHeader: 'LAIN LAIN', outputCode: 'PPH21_TER', partialMatch: true, note: 'Partial match — header mengandung "LAIN LAIN" dengan suffix variabel' },
];
