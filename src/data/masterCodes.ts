export interface MasterCode {
  description: string;
  code: string;
  inputType: string;
  company: string;
}

export const MASTER_CODES: MasterCode[] = [
  { description: 'Bonus', code: 'BONUS', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Bingkisan', code: 'BINGKISAN', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Reimbursement Kesehatan', code: 'AET', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Tali Asih', code: 'TA', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Reward Weekly', code: 'RW', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Fee Host Live', code: 'FHL', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Fee Talent Live', code: 'FTL', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Biaya Sewa Rumah / Kontrakan', code: 'SWR', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Sewa Mobil', code: 'SWM', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Basic Salary', code: 'BASIC', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Overtime', code: 'OVT', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'THR', code: 'THR', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Tunjangan PPH21 TER', code: 'PPH21_TER_ALW', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Bonus (AI)', code: 'AI', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Tunjangan Kehadiran', code: 'ALW2', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Tunjangan Profesi', code: 'ALW3', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Tunjangan Casting', code: 'ALW6', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'JKK', code: 'JKK', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'JKM', code: 'JKM', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'BPJS Kesehatan Company', code: 'BPJS_KES_CO', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'JHT Company', code: 'JHT_CO', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Jaminan Pensiun Company', code: 'JP_CO', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Potongan Absensi', code: 'ABS_PROF', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'BPJS Kesehatan Employee', code: 'BPJS_KES_EMP', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Jaminan Hari Tua Employee', code: 'JHT_EMP', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Jaminan Pensiun Employee', code: 'JP_EMP', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'BPJSTK PPU', code: 'BPTK', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Loan Deduction', code: 'LOAN_DED', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'PPH21 TER', code: 'PPH21_TER', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Manual Overtime Input', code: 'OVT_ALW', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Tunjangan Jabatan', code: 'ALW1', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Tunjangan Penugasan', code: 'ALW7', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Kekurangan Gaji', code: 'ADJ', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Kebijakan CEO', code: 'CEO', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
];

export const VALID_CODES = new Set(MASTER_CODES.map(m => m.code));
