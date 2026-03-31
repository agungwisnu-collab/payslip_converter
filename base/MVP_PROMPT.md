# MVP Build Prompt — Payslip Converter Website

> **Tujuan**: Membangun website converter payroll yang berjalan **100% di browser (client-side)**,
> deploy ke **GitHub Pages**, dan **tidak menyimpan data input** di manapun karena berisi data sensitif (gaji, NIK KTP).
>
> **Referensi**: [ANALYSIS.md](ANALYSIS.md) (logika transformasi) | [FEATURES.md](FEATURES.md) (fitur MVP M-01 s/d M-26)

---

## DAFTAR ISI

1. [Arsitektur & Tech Stack](#1-arsitektur--tech-stack)
2. [Struktur Project](#2-struktur-project)
3. [Step 1 — Project Setup & Konfigurasi](#3-step-1--project-setup--konfigurasi)
4. [Step 2 — Embedded Data (Rules & Master)](#4-step-2--embedded-data-rules--master)
5. [Step 3 — UI Layout & Komponen](#5-step-3--ui-layout--komponen)
6. [Step 4 — File Upload & Validasi (M-01, M-04, M-20)](#6-step-4--file-upload--validasi-m-01-m-04-m-20)
7. [Step 5 — Core Conversion Engine (M-05 s/d M-14)](#7-step-5--core-conversion-engine-m-05-sd-m-14)
8. [Step 6 — Anomaly Detection (M-23 s/d M-26)](#8-step-6--anomaly-detection-m-23-sd-m-26)
9. [Step 7 — Output Generation (M-15 s/d M-17)](#9-step-7--output-generation-m-15-sd-m-17)
10. [Step 8 — Progress & Summary UI (M-18 s/d M-19)](#10-step-8--progress--summary-ui-m-18-sd-m-19)
11. [Step 9 — Responsive UI & Polish (M-21, M-22)](#11-step-9--responsive-ui--polish-m-21-m-22)
12. [Step 10 — GitHub Pages Deployment](#12-step-10--github-pages-deployment)
13. [Step 11 — Testing & Validasi Akhir](#13-step-11--testing--validasi-akhir)
14. [Constraint & Larangan](#14-constraint--larangan)
15. [Checklist Final](#15-checklist-final)

---

## 1. Arsitektur & Tech Stack

### Keputusan Arsitektur: 100% Client-Side

Karena data payroll bersifat **sensitif** (gaji, NIK KTP, rekening bank), seluruh proses konversi
**wajib berjalan di browser**. Tidak ada backend, tidak ada API call, tidak ada file yang dikirim ke server.

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                               │
│                                                              │
│  ┌──────────┐   ┌──────────────┐   ┌────────────────────┐   │
│  │  Upload   │──▶│  Conversion  │──▶│  Output Generate   │   │
│  │  (File    │   │  Engine      │   │  (XLSX via         │   │
│  │   API)    │   │  (JS/TS)     │   │   ExcelJS)         │   │
│  └──────────┘   └──────────────┘   └────────────────────┘   │
│                         │                                    │
│              ┌──────────┴──────────┐                         │
│              │  Embedded Data      │                         │
│              │  (rules + master)   │                         │
│              │  as JS constants    │                         │
│              └─────────────────────┘                         │
│                                                              │
│  File TIDAK PERNAH meninggalkan browser.                     │
│  Tidak ada network request untuk data konversi.              │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| **Framework** | React 18+ dengan Vite | SPA, fast build, tree-shaking |
| **Language** | TypeScript | Type safety untuk mapping logic |
| **Styling** | Tailwind CSS | Utility-first, responsive tanpa CSS custom berlebih |
| **XLSX Read** | [SheetJS (xlsx)](https://www.npmjs.com/package/xlsx) | Baca Excel di browser, `data_only` equivalent |
| **XLSX Write** | [ExcelJS](https://www.npmjs.com/package/exceljs) | Tulis Excel dengan cell styling (fill, comment) untuk anomaly marking |
| **Icons** | Lucide React | Lightweight icon set |
| **Deploy** | GitHub Pages via GitHub Actions | Gratis, otomatis dari push ke `main` |
| **Testing** | Vitest + @testing-library/react | Unit test engine + UI test |

> **Catatan**: SheetJS dipilih untuk **membaca** karena otomatis resolve formula ke value (equivalent `data_only=True`).
> ExcelJS dipilih untuk **menulis** karena mendukung cell fill color dan comment (dibutuhkan untuk anomaly cell marking).

---

## 2. Struktur Project

```
payslip_converter/
├── base/                           # Dokumen analisis (tidak di-deploy)
│   ├── ANALYSIS.md
│   ├── FEATURES.md
│   ├── MVP_PROMPT.md
│   ├── input.xlsx                  # Sample input (test only)
│   ├── output.xlsx                 # Expected output (test only)
│   ├── rules.xlsx                  # Source untuk embedded rules
│   └── data helper.xlsx            # Source untuk embedded master
│
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component (SPA)
│   ├── types/
│   │   └── index.ts                # Type definitions
│   ├── data/
│   │   ├── rules.ts                # Embedded rules (dari rules.xlsx)
│   │   └── masterCodes.ts          # Embedded master data (dari data helper.xlsx)
│   ├── engine/
│   │   ├── parser.ts               # Parse input Excel
│   │   ├── validator.ts            # Validasi format input
│   │   ├── converter.ts            # Core conversion logic
│   │   ├── anomalyDetector.ts      # Anomaly detection (ANO-01 s/d ANO-08)
│   │   └── outputGenerator.ts      # Generate output Excel (success + anomaly)
│   ├── components/
│   │   ├── FileUpload.tsx          # Upload drag-and-drop
│   │   ├── ProgressIndicator.tsx   # 6-step progress bar
│   │   ├── ConversionSummary.tsx   # Ringkasan hasil
│   │   ├── ErrorDisplay.tsx        # Validation error display
│   │   └── DownloadButton.tsx      # Tombol download output
│   └── utils/
│       ├── excelReader.ts          # Wrapper SheetJS
│       ├── excelWriter.ts          # Wrapper ExcelJS
│       └── helpers.ts              # isNumeric, monthName, dll
│
├── public/
│   └── index.html
├── tests/
│   ├── engine/
│   │   ├── converter.test.ts       # Test conversion logic
│   │   ├── anomalyDetector.test.ts # Test anomaly detection
│   │   └── validator.test.ts       # Test input validation
│   └── testdata/
│       └── (symlink atau copy dari base/)
│
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions → GitHub Pages
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── index.html
```

---

## 3. Step 1 — Project Setup & Konfigurasi

### 3.1. Init Project

```bash
npm create vite@latest payslip-converter -- --template react-ts
cd payslip-converter
npm install
```

### 3.2. Install Dependencies

```bash
# Core
npm install xlsx exceljs file-saver lucide-react

# Styling
npm install -D tailwindcss @tailwindcss/vite

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

### 3.3. Konfigurasi Vite (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/payslip_converter/',  // ← Sesuaikan dengan nama repo GitHub
  build: {
    outDir: 'dist',
    sourcemap: false,           // Jangan expose source di production
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
```

### 3.4. Konfigurasi TypeScript (`tsconfig.json`)

Pastikan `strict: true` aktif untuk type safety maksimal.

### 3.5. Konfigurasi Tailwind (`src/index.css`)

```css
@import "tailwindcss";
```

---

## 4. Step 2 — Embedded Data (Rules & Master)

### 4.1. File `src/data/rules.ts` — Mapping Rules

> Sumber: `base/rules.xlsx`, Sheet `Rules`, Row 3-23.
> Rules di-hardcode sebagai array of objects. Urutan array = urutan output.

```typescript
/**
 * Setiap entry merepresentasikan 1 mapping dari kolom input → Other Input Code.
 *
 * - inputHeader: nama header di Row 1 file input (case-sensitive match)
 * - outputCode:  Other Input Code yang akan ditulis ke output
 * - priority:    khusus untuk BASIC — "high" berarti kolom ini prioritas utama
 *
 * PENTING: Urutan array ini = urutan baris output per karyawan.
 */
export interface RuleMapping {
  inputHeader: string;
  outputCode: string;
  priority?: 'high' | 'default';
  note?: string;
}

export const RULES: RuleMapping[] = [
  // ──── BASIC: 2 source, 1 output code ────
  { inputHeader: 'GP NEW',                              outputCode: 'BASIC',         priority: 'default', note: 'Fallback jika TOTAL GAJI PROPORSIONAL = 0' },
  { inputHeader: 'TOTAL GAJI PROPORSIONAL',              outputCode: 'BASIC',         priority: 'high',    note: 'High Priority dibanding GP New' },

  // ──── Tunjangan ────
  { inputHeader: 'T. JABATAN',                           outputCode: 'ALW1' },
  { inputHeader: 'T. KEHADIRAN',                         outputCode: 'ALW2' },
  { inputHeader: 'T. PROFESI',                           outputCode: 'ALW3' },
  { inputHeader: 'T. CASTING',                           outputCode: 'ALW6' },
  { inputHeader: 'T. PENUGASAN',                         outputCode: 'ALW7' },
  { inputHeader: 'T. BEBAN KERJA',                       outputCode: 'PPH21_TER_ALW' },

  // ──── Benefit & Allowance ────
  { inputHeader: 'U. SEWA KEND',                         outputCode: 'SWM' },
  { inputHeader: 'KEKURANGAN GAJI',                      outputCode: 'ADJ' },
  { inputHeader: 'REIMBURSEMENT KESEHATAN',              outputCode: 'AET' },
  { inputHeader: 'LEMBUR',                               outputCode: 'OVT' },
  { inputHeader: 'BONUS SALES (Rp)',                     outputCode: 'BONUS' },
  { inputHeader: 'KEBIJAKAN CEO',                        outputCode: 'CEO' },

  // ──── Deduction ────
  { inputHeader: 'CICILAN PINJAMAN',                     outputCode: 'LOAN_DED' },
  { inputHeader: 'POTONGAN ABSEN KEHDRAN & PROFESI',     outputCode: 'ABS_PROF' },

  // ──── BPJS ────
  { inputHeader: 'BPJS KESEHATAN',                       outputCode: 'BPJS_KES_EMP' },
  { inputHeader: 'BPJS TK PPU',                          outputCode: 'BPTK' },
  { inputHeader: 'BPJS TK BPU ( KHUSUS CS KEMITRAAN)',   outputCode: 'BPTK',         note: 'Sama kode dengan PPU — mutually exclusive' },
];
```

### 4.2. File `src/data/masterCodes.ts` — Master Data Helper

> Sumber: `base/data helper.xlsx`, Sheet `Sheet1`, 34 records.
> Digunakan untuk validasi bahwa setiap outputCode ada di master.

```typescript
export interface MasterCode {
  description: string;
  code: string;
  inputType: string;
  company: string;
}

export const MASTER_CODES: MasterCode[] = [
  { description: 'Bonus',                         code: 'BONUS',         inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Bingkisan',                     code: 'BINGKISAN',     inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Reimbursement Kesehatan',        code: 'AET',           inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Tali Asih',                     code: 'TA',            inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Reward Weekly',                  code: 'RW',            inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Fee Host Live',                  code: 'FHL',           inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Fee Talent Live',                code: 'FTL',           inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Biaya Sewa Rumah / Kontrakan',   code: 'SWR',           inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Sewa Mobil',                     code: 'SWM',           inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Basic Salary',                   code: 'BASIC',         inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Overtime',                       code: 'OVT',           inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'THR',                             code: 'THR',           inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Tunjangan PPH21 TER',            code: 'PPH21_TER_ALW', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Bonus (AI)',                     code: 'AI',            inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Tunjangan Kehadiran',            code: 'ALW2',          inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Tunjangan Profesi',              code: 'ALW3',          inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Tunjangan Casting',              code: 'ALW6',          inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'JKK',                            code: 'JKK',           inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'JKM',                            code: 'JKM',           inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'BPJS Kesehatan Company',         code: 'BPJS_KES_CO',  inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'JHT Company',                    code: 'JHT_CO',        inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Jaminan Pensiun Company',        code: 'JP_CO',         inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Potongan Absensi',               code: 'ABS_PROF',      inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'BPJS Kesehatan Employee',        code: 'BPJS_KES_EMP', inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Jaminan Hari Tua Employee',      code: 'JHT_EMP',       inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Jaminan Pensiun Employee',       code: 'JP_EMP',        inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'BPJSTK PPU',                     code: 'BPTK',          inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Loan Deduction',                 code: 'LOAN_DED',      inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'PPH21 TER',                      code: 'PPH21_TER',     inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Manual Overtime Input',           code: 'OVT_ALW',       inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Tunjangan Jabatan',              code: 'ALW1',          inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Tunjangan Penugasan',            code: 'ALW7',          inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Kekurangan Gaji',                code: 'ADJ',           inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
  { description: 'Kebijakan CEO',                  code: 'CEO',           inputType: 'Manual Entries', company: 'PT Etos Kreatif Indonesia' },
];

/** Set untuk lookup cepat O(1) */
export const VALID_CODES = new Set(MASTER_CODES.map(m => m.code));
```

---

## 5. Step 3 — UI Layout & Komponen

### 5.1. Desain UI — Single Page, 3 State

```
┌────────────────────────────────────────────────────────┐
│                   PAYSLIP CONVERTER                     │
│              Payroll → Other Input Entries               │
├────────────────────────────────────────────────────────┤
│                                                         │
│  STATE 1: IDLE (belum upload)                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │           ┌───────────────────────┐              │   │
│  │           │    📁 Drag & Drop     │              │   │
│  │           │    atau klik untuk    │              │   │
│  │           │    pilih file .xlsx   │              │   │
│  │           └───────────────────────┘              │   │
│  │      Hanya menerima file .xlsx / .xls            │   │
│  │      File diproses di browser — tidak di-upload   │   │
│  │      ke server manapun.                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  STATE 2: PROCESSING (sedang konversi)                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ● Upload ✓                                       │   │
│  │  ● Validasi format ✓                              │   │
│  │  ◉ Parsing data karyawan...              [====  ] │   │
│  │  ○ Mapping komponen gaji                          │   │
│  │  ○ Generating output                              │   │
│  │  ○ Selesai                                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  STATE 3a: DONE — SUCCESS                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ✅ Konversi berhasil!                            │   │
│  │                                                    │   │
│  │  Karyawan diproses  : 3                            │   │
│  │  Baris output       : 18                           │   │
│  │  Baris di-skip      : 0                            │   │
│  │  Anomali ditemukan  : 0                            │   │
│  │                                                    │   │
│  │  ┌──────────────────────────────────────────┐     │   │
│  │  │  ⬇ Download Output                       │     │   │
│  │  │  Other_Input_Entries_Feb2026_20260331.xlsx│     │   │
│  │  └──────────────────────────────────────────┘     │   │
│  │                                                    │   │
│  │  [Konversi file lain]                              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  STATE 3b: DONE — ANOMALY                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ⚠️ Ditemukan anomali pada data input!            │   │
│  │                                                    │   │
│  │  Karyawan diproses  : 3                            │   │
│  │  Anomali ditemukan  : 2                            │   │
│  │                                                    │   │
│  │  Detail anomali:                                   │   │
│  │  ┌────┬──────────┬───────┬─────────────────┐     │   │
│  │  │Row │ NIK      │ Tipe  │ Deskripsi        │     │   │
│  │  ├────┼──────────┼───────┼─────────────────┤     │   │
│  │  │ 4  │7777-6654 │ANO-05 │ Dual BPTK...    │     │   │
│  │  │ 2  │221115-.. │ANO-03 │ Non-numeric...  │     │   │
│  │  └────┴──────────┴───────┴─────────────────┘     │   │
│  │                                                    │   │
│  │  ┌──────────────────────────────────────────┐     │   │
│  │  │  ⬇ Download Error Report                  │     │   │
│  │  │  Conversion_Error_20260331.xlsx            │     │   │
│  │  └──────────────────────────────────────────┘     │   │
│  │                                                    │   │
│  │  [Konversi file lain]                              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  STATE 3c: DONE — VALIDATION FAIL                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ❌ File tidak valid                              │   │
│  │                                                    │   │
│  │  • Sheet "PAYROLL" tidak ditemukan.               │   │
│  │    Sheet yang tersedia: Sheet1, Data               │   │
│  │                                                    │   │
│  │  [Upload ulang]                                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  Catatan: Semua proses dilakukan di browser Anda.       │
│  File tidak dikirim ke server manapun.                   │
│  © 2026 Payslip Converter                                │
└────────────────────────────────────────────────────────┘
```

### 5.2. App State Machine

```typescript
type AppState =
  | { status: 'idle' }
  | { status: 'processing'; step: 1 | 2 | 3 | 4 | 5 | 6; message: string }
  | { status: 'success'; summary: ConversionSummary; outputBlob: Blob; fileName: string }
  | { status: 'anomaly'; summary: ConversionSummary; anomalies: Anomaly[]; outputBlob: Blob; fileName: string }
  | { status: 'validation-error'; errors: string[] };
```

---

## 6. Step 4 — File Upload & Validasi (M-01, M-04, M-20)

### 6.1. File Upload Handler (`FileUpload.tsx`)

```typescript
// Spesifikasi:
// - Accept: .xlsx, .xls
// - Max file: 1
// - Drag-and-drop area + click-to-browse
// - Saat file dipilih, langsung memulai proses konversi (auto-start)
// - TIDAK menyimpan file ke variabel global atau state management permanen
//   File dibaca → diproses → referensi di-release

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  disabled: boolean;
}
```

**Validasi yang dilakukan (sebelum parsing):**

| # | Validasi | Error Message | Aksi |
|---|---|---|---|
| V-01 | Ekstensi file | `"Format file tidak didukung. Hanya menerima file .xlsx atau .xls"` | STOP |
| V-02 | File bisa dibaca | `"File tidak bisa dibaca. File mungkin corrupt atau dilindungi password"` | STOP |
| V-03 | Sheet `PAYROLL` ada | `"Sheet 'PAYROLL' tidak ditemukan. Sheet yang tersedia: {list}. Pastikan file input memiliki sheet bernama 'PAYROLL'"` | STOP |
| V-04 | Header Row 1 punya kolom NIK (B) dan NAMA (C) | `"Header kolom tidak sesuai. Kolom B harus 'NIK' dan kolom C harus 'NAMA'. Ditemukan: B='{actual_B}', C='{actual_C}'"` | STOP |
| V-05 | Header Row 1 punya kolom PERIODE (AB) | `"Kolom 'PERIODE' tidak ditemukan di header. Pastikan kolom AB berisi header 'PERIODE'"` | STOP |
| V-06 | Minimal 1 header dari rules ditemukan | `"Tidak ada kolom payroll yang cocok dengan mapping rules. Pastikan header Row 1 sesuai format payroll standar"` | STOP |

### 6.2. Header Matching Logic

```typescript
/**
 * Dynamic Column Mapping (M-07):
 * JANGAN hardcode posisi kolom. Cari posisi kolom berdasarkan header name matching.
 *
 * Langkah:
 * 1. Baca semua cell di Row 1 → bangun Map<headerName, columnIndex>
 * 2. Untuk setiap rule di RULES, cari columnIndex berdasarkan rule.inputHeader
 * 3. Matching: case-insensitive, trim whitespace
 * 4. Jika header rule tidak ditemukan di input → catat sebagai anomali ANO-07
 */

function buildColumnMap(headerRow: any[]): Map<string, number> {
  const map = new Map<string, number>();
  headerRow.forEach((cell, index) => {
    if (cell != null) {
      const normalized = String(cell).trim().toUpperCase();
      map.set(normalized, index);
    }
  });
  return map;
}

function matchRuleToColumn(
  rule: RuleMapping,
  columnMap: Map<string, number>
): number | null {
  const normalizedHeader = rule.inputHeader.trim().toUpperCase();
  return columnMap.get(normalizedHeader) ?? null;
}
```

---

## 7. Step 5 — Core Conversion Engine (M-05 s/d M-14)

### 7.1. Type Definitions (`src/types/index.ts`)

```typescript
/** Baris output yang dihasilkan converter */
export interface OutputRow {
  employee: string;        // Nama karyawan (kolom C input)
  employeeId: string;      // NIK apa adanya (kolom B input) — JANGAN konversi tipe
  otherInputCode: string;  // Code dari rules mapping
  payslipPeriod: number;   // Tahun (float) dari PERIODE
  month: string;           // Nama bulan English dari PERIODE
  amount: number;          // Nilai numerik
}

/** Anomali yang terdeteksi */
export interface Anomaly {
  row: number;             // Row number di file input (1-based)
  column: string;          // Column letter (A, B, AB, dll)
  employeeName: string;
  nik: string;
  field: string;           // Header name
  value: any;              // Nilai aktual
  errorType: AnomalyType;
  description: string;
}

export type AnomalyType =
  | 'ANO-01'   // NIK tanpa dash
  | 'ANO-02'   // Nama kosong
  | 'ANO-03'   // Non-numeric value
  | 'ANO-04'   // Kode tidak di master
  | 'ANO-05'   // Dual BPTK conflict
  | 'ANO-06'   // Negative amount
  | 'ANO-07'   // Header mismatch
  | 'ANO-08';  // Duplicate NIK

export interface ConversionSummary {
  totalEmployees: number;
  totalOutputRows: number;
  skippedRows: number;
  skippedReasons: { row: number; reason: string }[];
  anomalyCount: number;
  periode: string;          // e.g. "February 2026"
}

export interface ConversionResult {
  success: boolean;
  outputRows: OutputRow[];
  anomalies: Anomaly[];
  summary: ConversionSummary;
}
```

### 7.2. Core Converter (`src/engine/converter.ts`)

> **Ini adalah file PALING KRITIS. Implementasi harus PERSIS mengikuti pseudocode di ANALYSIS.md Section 10.**

```typescript
/**
 * ALUR UTAMA CONVERTER:
 *
 * 1. Baca header Row 1 → bangun columnMap
 * 2. Validasi header (V-04, V-05, V-06)
 * 3. Temukan posisi kolom khusus: NIK (B), NAMA (C), PERIODE (AB)
 * 4. Temukan posisi kolom GP_NEW dan TOTAL_GAJI_PROPORSIONAL untuk BASIC rule
 * 5. Bangun resolvedRules: mapping rules yang berhasil matched ke kolom input
 * 6. Loop setiap row mulai Row 2:
 *    a. Ambil NIK dan NAMA
 *    b. Skip row jika NIK tidak ada dash DAN nama kosong (M-06)
 *    c. Ambil PERIODE → derive year + month (M-11)
 *    d. Proses BASIC (RULE 1 — priority AF vs AC) (M-08)
 *    e. Loop setiap resolvedRule (non-BASIC):
 *       - Ambil value dari cell
 *       - Filter: skip jika bukan numerik ATAU == 0 (M-10)
 *       - Handle BPTK exclusive (M-09)
 *       - Validasi code terhadap master (M-12)
 *       - Push ke outputRows
 *    f. Urutkan baris output per karyawan sesuai urutan rules (M-13)
 * 7. Return ConversionResult
 */
```

### 7.3. Detail Logic per Rule

#### M-05: Parsing Input Excel

```typescript
import * as XLSX from 'xlsx';

function parseInput(fileBuffer: ArrayBuffer): XLSX.WorkSheet {
  // SheetJS otomatis resolve formula ke value (equivalent data_only=True)
  const workbook = XLSX.read(fileBuffer, { type: 'array' });

  // Validasi sheet PAYROLL ada
  if (!workbook.SheetNames.includes('PAYROLL')) {
    throw new ValidationError(
      `Sheet 'PAYROLL' tidak ditemukan. Sheet yang tersedia: ${workbook.SheetNames.join(', ')}`
    );
  }

  return workbook.Sheets['PAYROLL'];
}
```

#### M-06: Skip Row Logic

```typescript
function shouldSkipRow(nik: any, nama: any): boolean {
  const nikHasDash = typeof nik === 'string' && nik.includes('-');
  const nameFilled = nama != null && String(nama).trim() !== '';

  // Skip HANYA jika NIK tidak ada dash DAN nama kosong
  // Artinya: jika salah satu terpenuhi, baris TETAP diproses
  return !nikHasDash && !nameFilled;
}
```

#### M-08: BASIC Priority Rule

```typescript
function resolveBasic(
  gpNewValue: any,
  totalGajiPropValue: any
): { value: number; source: string } | null {
  const afNumeric = isNumeric(totalGajiPropValue) && totalGajiPropValue > 0;
  const acNumeric = isNumeric(gpNewValue);

  if (afNumeric) {
    // TOTAL GAJI PROPORSIONAL > 0 → gunakan sebagai BASIC
    return { value: totalGajiPropValue, source: 'TOTAL GAJI PROPORSIONAL' };
  }

  if (acNumeric && gpNewValue !== 0) {
    // Fallback ke GP NEW
    return { value: gpNewValue, source: 'GP NEW' };
  }

  // Kedua kolom kosong/zero → tidak ada BASIC
  return null;
}
```

#### M-09: BPTK Exclusive Rule

```typescript
function resolveBptk(
  bpjsTkPpuValue: any,
  bpjsTkBpuValue: any
): { value: number; source: string } | null {
  const ppuValid = isNumeric(bpjsTkPpuValue) && bpjsTkPpuValue !== 0;
  const bpuValid = isNumeric(bpjsTkBpuValue) && bpjsTkBpuValue !== 0;

  if (ppuValid && bpuValid) {
    // ANOMALY ANO-05: keduanya terisi — tetap ambil PPU tapi catat anomali
    return { value: bpjsTkPpuValue, source: 'BPJS TK PPU (conflict: BPU juga terisi)' };
  }

  if (ppuValid) {
    return { value: bpjsTkPpuValue, source: 'BPJS TK PPU' };
  }

  if (bpuValid) {
    return { value: bpjsTkBpuValue, source: 'BPJS TK BPU' };
  }

  return null;
}
```

#### M-10: Zero/Null/Non-Numeric Filter

```typescript
function isNumeric(value: any): boolean {
  if (value == null) return false;
  if (typeof value === 'number' && !isNaN(value)) return true;
  // String TIDAK dianggap numerik — jangan konversi
  return false;
}

function shouldOutputValue(value: any): boolean {
  return isNumeric(value) && value !== 0;
}
```

#### M-11: Periode Derivation

```typescript
function derivePeriode(periodeValue: any): { year: number; month: string } {
  let date: Date;

  if (periodeValue instanceof Date) {
    date = periodeValue;
  } else if (typeof periodeValue === 'number') {
    // Excel serial date number → JS Date
    date = excelSerialToDate(periodeValue);
  } else {
    throw new Error(`Kolom PERIODE berisi tipe tidak terduga: ${typeof periodeValue}`);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return {
    year: date.getFullYear(),
    month: monthNames[date.getMonth()],
  };
}

function excelSerialToDate(serial: number): Date {
  // Excel epoch: January 1, 1900 (with leap year bug)
  const utcDays = Math.floor(serial - 25569);
  const utcMs = utcDays * 86400 * 1000;
  return new Date(utcMs);
}
```

#### M-14: Employee ID Preservation

```typescript
function preserveEmployeeId(rawValue: any): string {
  // Pertahankan apa adanya — JANGAN konversi string ke number atau sebaliknya
  if (rawValue == null) return '';
  if (typeof rawValue === 'string') return rawValue;
  if (typeof rawValue === 'number') return String(rawValue);
  return String(rawValue);
}
```

> **PENTING**: Saat menulis ke Excel output, pastikan Employee ID ditulis sebagai **string**
> agar Excel tidak otomatis mengubahnya ke number (yang menghilangkan leading zero dan dash).

---

## 8. Step 6 — Anomaly Detection (M-23 s/d M-26)

### 8.1. Anomaly Detector (`src/engine/anomalyDetector.ts`)

Anomaly detection berjalan **bersamaan** dengan conversion loop, bukan sebagai pass terpisah.

```typescript
/**
 * KAPAN anomali dideteksi:
 *
 * SEBELUM conversion loop:
 *   - ANO-07: Header mismatch (saat buildColumnMap)
 *   - ANO-04: Kode tidak di master (saat validasi rules vs master)
 *
 * SAAT conversion loop per row:
 *   - ANO-01: NIK tanpa dash (tapi nama terisi → tetap proses, tandai)
 *   - ANO-02: Nama kosong (tapi NIK valid → tetap proses, tandai)
 *   - ANO-03: Non-numeric value di cell yang seharusnya numerik
 *   - ANO-05: Dual BPTK conflict
 *   - ANO-06: Negative amount
 *
 * SETELAH conversion loop:
 *   - ANO-08: Duplicate NIK (scan semua NIK yang diproses)
 */
```

### 8.2. Implementasi per Tipe Anomali

```typescript
// ANO-01: NIK tanpa dash (tapi nama terisi)
// Trigger: typeof nik === 'string' && !nik.includes('-') && nameFilled
// Atau: typeof nik === 'number' && nameFilled
// Action: TETAP proses baris, tapi catat anomali
{
  errorType: 'ANO-01',
  description: `NIK "${nik}" tidak mengandung karakter dash (-). Baris tetap diproses.`
}

// ANO-02: Nama kosong (tapi NIK valid/ada dash)
// Trigger: nikHasDash && !nameFilled
// Action: TETAP proses baris, tapi catat anomali
{
  errorType: 'ANO-02',
  description: `Nama karyawan kosong untuk NIK "${nik}". Baris tetap diproses.`
}

// ANO-03: Non-numeric value
// Trigger: cell seharusnya numerik (ada di mapping) tapi typeof !== 'number'
//          AND cell != null AND cell != ''
// Action: Skip cell, catat anomali
{
  errorType: 'ANO-03',
  description: `Cell berisi "${value}" (${typeof value}) yang bukan numerik. Kolom: ${headerName}. Cell di-skip.`
}

// ANO-04: Kode tidak di master
// Trigger: outputCode dari rules TIDAK ada di VALID_CODES
// Action: Catat anomali, proses tetap jalan
// Catatan: Ini kemungkinan terjadi hanya jika rules.ts diubah secara tidak benar
{
  errorType: 'ANO-04',
  description: `Other Input Code "${code}" dari rules tidak ditemukan di master data.`
}

// ANO-05: Dual BPTK conflict
// Trigger: BPJS TK PPU > 0 DAN BPJS TK BPU > 0
// Action: Ambil PPU, catat anomali
{
  errorType: 'ANO-05',
  description: `Kedua kolom BPJS TK PPU (${ppuValue}) dan BPJS TK BPU (${bpuValue}) terisi > 0. Seharusnya hanya satu. Menggunakan PPU.`
}

// ANO-06: Negative amount
// Trigger: value < 0 DAN code BUKAN 'LOAN_DED', 'ABS_PROF', 'ADJ'
// (Loan, potongan absensi, dan adjustment boleh negatif)
// Action: TETAP output, tapi catat anomali
const NEGATIVE_ALLOWED_CODES = ['LOAN_DED', 'ABS_PROF', 'ADJ'];
{
  errorType: 'ANO-06',
  description: `Nilai negatif (${value}) pada kolom ${headerName}. Komponen ini biasanya bernilai positif.`
}

// ANO-07: Header mismatch
// Trigger: rule.inputHeader tidak ditemukan di headerRow (setelah normalisasi)
// Action: Skip mapping untuk header ini, catat anomali
{
  errorType: 'ANO-07',
  description: `Header "${rule.inputHeader}" dari rules tidak ditemukan di file input. Kolom ini di-skip.`
}

// ANO-08: Duplicate NIK
// Trigger: Setelah loop selesai, NIK yang sama muncul > 1 kali
// Action: Catat anomali untuk semua occurrence setelah yang pertama
{
  errorType: 'ANO-08',
  description: `NIK "${nik}" ditemukan duplikat (muncul ${count}x di file input). Baris ke-${n}.`
}
```

### 8.3. Keputusan: Anomali = Output Error atau Continue?

```typescript
/**
 * DECISION MATRIX:
 *
 * Ada anomali?  →  Generate ERROR output (file dengan tab Data + Error)
 * Tidak ada     →  Generate NORMAL output (file 6 kolom standar)
 *
 * PENTING: Jika ada anomali, SELURUH konversi menghasilkan error output.
 * Tidak ada "partial success" — ini all-or-nothing.
 *
 * Anomali yang RINGAN (ANO-01, ANO-02) tetap menyebabkan error output.
 * Alasan: user harus aware bahwa ada data yang tidak 100% bersih.
 */
```

---

## 9. Step 7 — Output Generation (M-15 s/d M-17)

### 9.1. Success Output (`outputGenerator.ts` — Normal Path)

```typescript
import ExcelJS from 'exceljs';

async function generateSuccessOutput(
  outputRows: OutputRow[],
  periode: { year: number; month: string }
): Promise<{ blob: Blob; fileName: string }> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');

  // Header Row 1
  sheet.addRow([
    'Employee',
    'Employee ID',
    'Other Input Code',
    'Payslip Period',
    'Month',
    'Amount'
  ]);

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  // Data rows
  for (const row of outputRows) {
    const dataRow = sheet.addRow([
      row.employee,
      row.employeeId,    // String — HARUS tetap string di Excel
      row.otherInputCode,
      row.payslipPeriod,  // Float (e.g. 2026)
      row.month,          // String (e.g. "February")
      row.amount,         // Number
    ]);

    // Force Employee ID as text to prevent Excel auto-conversion
    dataRow.getCell(2).numFmt = '@';  // Text format
  }

  // Auto-width kolom
  sheet.columns.forEach(col => {
    col.width = 20;
  });

  // Generate blob
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  // Filename: Other_Input_Entries_{Month}{Year}_{timestamp}.xlsx
  const timestamp = formatTimestamp(new Date());
  const fileName = `Other_Input_Entries_${periode.month}${periode.year}_${timestamp}.xlsx`;

  return { blob, fileName };
}
```

### 9.2. Anomaly Output (`outputGenerator.ts` — Error Path)

```typescript
async function generateAnomalyOutput(
  inputData: any[][],           // Raw input data apa adanya
  inputHeaders: string[],       // Header row
  anomalies: Anomaly[]
): Promise<{ blob: Blob; fileName: string }> {
  const workbook = new ExcelJS.Workbook();

  // ──── TAB 1: Data (salinan input apa adanya) ────
  const dataSheet = workbook.addWorksheet('Data');

  // Tulis header
  dataSheet.addRow(inputHeaders);
  dataSheet.getRow(1).font = { bold: true };

  // Tulis data rows
  for (const rowData of inputData) {
    dataSheet.addRow(rowData);
  }

  // Mark anomaly cells dengan highlight merah + comment
  for (const anomaly of anomalies) {
    const colIndex = columnLetterToIndex(anomaly.column);  // Convert "AX" → 50
    if (anomaly.row > 0 && colIndex > 0) {
      const cell = dataSheet.getCell(anomaly.row, colIndex);

      // Fill merah (#FFC7CE)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC7CE' },
      };

      // Comment
      cell.note = {
        texts: [
          { text: `[${anomaly.errorType}] ${anomaly.description}` }
        ],
      };
    }
  }

  // ──── TAB 2: Error (detail anomali) ────
  const errorSheet = workbook.addWorksheet('Error');

  // Header
  errorSheet.addRow([
    'Row', 'Column', 'Employee Name', 'NIK',
    'Field', 'Value', 'Error Type', 'Description'
  ]);

  const errorHeaderRow = errorSheet.getRow(1);
  errorHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  errorHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFCC0000' },  // Dark red header
  };

  // Data rows
  for (const a of anomalies) {
    errorSheet.addRow([
      a.row, a.column, a.employeeName, a.nik,
      a.field, String(a.value), a.errorType, a.description
    ]);
  }

  // Auto-width
  errorSheet.columns.forEach(col => { col.width = 22; });

  // Generate blob
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const timestamp = formatTimestamp(new Date());
  const fileName = `Conversion_Error_${timestamp}.xlsx`;

  return { blob, fileName };
}
```

### 9.3. Download Handler

```typescript
import { saveAs } from 'file-saver';

function downloadFile(blob: Blob, fileName: string): void {
  saveAs(blob, fileName);
}
```

### 9.4. Timestamp Format

```typescript
function formatTimestamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}_${h}${min}${s}`;
}
```

---

## 10. Step 8 — Progress & Summary UI (M-18 s/d M-19)

### 10.1. Progress Steps

```typescript
const PROGRESS_STEPS = [
  { step: 1, label: 'Upload',              description: 'File diterima' },
  { step: 2, label: 'Validasi format',      description: 'Memeriksa sheet dan header' },
  { step: 3, label: 'Parsing data',          description: 'Membaca data karyawan' },
  { step: 4, label: 'Mapping komponen',      description: 'Mencocokkan kolom payroll → kode output' },
  { step: 5, label: 'Generating output',     description: 'Membuat file hasil' },
  { step: 6, label: 'Selesai',              description: 'Konversi selesai' },
];
```

### 10.2. Integrasi Progress ke Conversion Flow

```typescript
async function runConversion(
  file: File,
  onProgress: (step: number, message: string) => void
): Promise<ConversionResult> {
  // Step 1: Upload
  onProgress(1, 'File diterima');
  const buffer = await file.arrayBuffer();

  // Step 2: Validasi
  onProgress(2, 'Memeriksa sheet dan header...');
  const worksheet = parseInput(buffer);
  validateHeaders(worksheet);

  // Step 3: Parsing
  onProgress(3, 'Membaca data karyawan...');
  const { headers, rows, rawData } = extractData(worksheet);

  // Step 4: Mapping
  onProgress(4, 'Mencocokkan kolom payroll → kode output...');
  const columnMap = buildColumnMap(headers);
  const result = convertRows(rows, columnMap, headers);

  // Step 5: Generate
  onProgress(5, 'Membuat file hasil...');
  // (output generation happens in caller based on result)

  // Step 6: Done
  onProgress(6, 'Konversi selesai');

  return result;
}
```

### 10.3. Summary Display (`ConversionSummary.tsx`)

```typescript
// Tampilkan setelah konversi selesai:
interface SummaryDisplayProps {
  summary: ConversionSummary;
}

// Layout:
// ┌──────────────────────────────────┐
// │  Karyawan diproses    : 3        │
// │  Baris output         : 18       │
// │  Baris di-skip        : 2        │
// │    └ Row 5: NIK tanpa dash, ...  │
// │    └ Row 8: Baris kosong         │
// │  Anomali ditemukan    : 0        │
// └──────────────────────────────────┘
```

---

## 11. Step 9 — Responsive UI & Polish (M-21, M-22)

### 11.1. Layout Requirements

```
// Mobile-first responsive breakpoints:
// - < 768px  : Tidak dioptimasi (tampil tapi mungkin scroll horizontal)
// - 768px+   : Tablet — single column, padding dikurangi
// - 1024px+  : Desktop — centered card, max-width 720px

// Komponen utama: 1 card di tengah layar
// Background: gray-50 atau slate-50
// Card: white, rounded-lg, shadow-lg, padding 6-8
```

### 11.2. Tailwind Classes Reference

```html
<!-- Container -->
<div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
  <div class="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
    <!-- Content -->
  </div>
</div>

<!-- Upload area -->
<div class="border-2 border-dashed border-slate-300 rounded-xl p-12
            hover:border-blue-400 hover:bg-blue-50 transition-colors
            cursor-pointer text-center">
  <!-- Drag & drop content -->
</div>

<!-- Progress step (active) -->
<div class="flex items-center gap-3">
  <div class="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center
              animate-pulse text-sm font-bold">3</div>
  <span class="text-slate-700 font-medium">Parsing data karyawan...</span>
</div>

<!-- Progress step (done) -->
<div class="flex items-center gap-3">
  <div class="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center
              text-sm">✓</div>
  <span class="text-slate-500">Validasi format</span>
</div>

<!-- Download button -->
<button class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold
               py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
  <DownloadIcon size={20} />
  Download Output
</button>

<!-- Error button (anomaly) -->
<button class="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold
               py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
  <AlertTriangleIcon size={20} />
  Download Error Report
</button>
```

### 11.3. Security Notice di Footer

```html
<div class="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1">
  <ShieldCheckIcon size={14} />
  Semua proses dilakukan di browser Anda. File tidak dikirim ke server manapun.
</div>
```

---

## 12. Step 10 — GitHub Pages Deployment

### 12.1. GitHub Actions Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 12.2. Vite Base Path

```typescript
// vite.config.ts — base HARUS sesuai nama repo
export default defineConfig({
  base: '/payslip_converter/',
  // ...
});
```

### 12.3. Setup GitHub Pages

1. Buka repo → Settings → Pages
2. Source: **GitHub Actions** (bukan branch)
3. Push ke `main` → otomatis build & deploy

### 12.4. File yang TIDAK boleh ter-deploy

Tambahkan ke `.gitignore` atau exclude dari build:

```gitignore
# Data sensitif — JANGAN commit ke repo
base/input.xlsx
base/output.xlsx

# File referensi (boleh commit karena hanya rules & master, bukan data karyawan)
# base/rules.xlsx      → ini BOLEH commit
# base/data helper.xlsx → ini BOLEH commit
```

> **PENTING**: File `base/input.xlsx` dan `base/output.xlsx` berisi data karyawan nyata
> (gaji, NIK KTP, rekening). **JANGAN PERNAH commit ke repository.**
> Tambahkan ke `.gitignore` SEBELUM commit pertama.

---

## 13. Step 11 — Testing & Validasi Akhir

### 13.1. Unit Test: Conversion Engine

```typescript
// tests/engine/converter.test.ts

describe('Converter', () => {
  describe('resolveBasic', () => {
    it('should use TOTAL GAJI PROPORSIONAL when > 0', () => {
      const result = resolveBasic(7500000, 5000000);
      expect(result?.value).toBe(5000000);
      expect(result?.source).toContain('TOTAL GAJI PROPORSIONAL');
    });

    it('should fallback to GP NEW when TOTAL GAJI PROPORSIONAL = 0', () => {
      const result = resolveBasic(7500000, 0);
      expect(result?.value).toBe(7500000);
      expect(result?.source).toContain('GP NEW');
    });

    it('should return null when both are 0', () => {
      const result = resolveBasic(0, 0);
      expect(result).toBeNull();
    });
  });

  describe('resolveBptk', () => {
    it('should use PPU when only PPU has value', () => {
      const result = resolveBptk(100000, null);
      expect(result?.value).toBe(100000);
    });

    it('should use BPU when only BPU has value', () => {
      const result = resolveBptk(null, 5000);
      expect(result?.value).toBe(5000);
    });

    it('should use PPU and flag conflict when both have values', () => {
      const result = resolveBptk(100000, 5000);
      expect(result?.value).toBe(100000);
      expect(result?.source).toContain('conflict');
    });
  });

  describe('shouldSkipRow', () => {
    it('should skip when NIK has no dash AND name is empty', () => {
      expect(shouldSkipRow(12345, null)).toBe(true);
      expect(shouldSkipRow(12345, '')).toBe(true);
    });

    it('should NOT skip when NIK has dash', () => {
      expect(shouldSkipRow('1234-5678', null)).toBe(false);
    });

    it('should NOT skip when name is filled', () => {
      expect(shouldSkipRow(12345, 'PRABOWO')).toBe(false);
    });
  });

  describe('isNumeric', () => {
    it('should return true for numbers', () => {
      expect(isNumeric(100000)).toBe(true);
      expect(isNumeric(0)).toBe(true);
      expect(isNumeric(-5000)).toBe(true);
      expect(isNumeric(3.14)).toBe(true);
    });

    it('should return false for non-numbers', () => {
      expect(isNumeric(null)).toBe(false);
      expect(isNumeric(undefined)).toBe(false);
      expect(isNumeric('')).toBe(false);
      expect(isNumeric('abc')).toBe(false);
      expect(isNumeric('100000')).toBe(false);
    });
  });

  describe('derivePeriode', () => {
    it('should extract year and month from Date', () => {
      const result = derivePeriode(new Date(2026, 1, 25)); // February
      expect(result.year).toBe(2026);
      expect(result.month).toBe('February');
    });
  });
});
```

### 13.2. Unit Test: Anomaly Detection

```typescript
// tests/engine/anomalyDetector.test.ts

describe('Anomaly Detection', () => {
  it('ANO-01: should detect NIK without dash when name exists', () => {
    // NIK = 77776654 (no dash), Name = "PRABOWO"
    // → anomali tapi baris tetap diproses
  });

  it('ANO-05: should detect dual BPTK', () => {
    // PPU = 200000, BPU = 150000
    // → anomali, gunakan PPU
  });

  it('ANO-06: should detect negative amount on non-deduction', () => {
    // BASIC = -5000000 → anomali
    // LOAN_DED = -2000000 → BUKAN anomali (deduction boleh negatif)
  });

  it('ANO-08: should detect duplicate NIK', () => {
    // 2 rows with NIK = '1234-5678'
  });
});
```

### 13.3. Integration Test: Full Pipeline

```typescript
// tests/engine/integration.test.ts

describe('Full Conversion Pipeline', () => {
  it('should produce 18 rows for 3 employees (matching output.xlsx)', async () => {
    // Load base/input.xlsx
    // Run full conversion
    // Compare with base/output.xlsx

    // Expected:
    // TIFA LOCKHEART  → 8 rows (BASIC, ALW1, ALW7, AET, CEO, LOAN_DED, BPJS_KES_EMP, BPTK)
    // HIDUP JOKOWEE   → 6 rows (BASIC, ALW1, ALW2, LOAN_DED, BPJS_KES_EMP, BPTK)
    // PRABOWO SUGIANTORO → 4 rows (BASIC, ALW2, ALW6, BPTK)
    // Total = 18 rows
  });

  it('should match exact amounts for each employee', async () => {
    // TIFA: BASIC=7500000, ALW1=10000000, ALW7=2000000, AET=1500000,
    //       CEO=50000000, LOAN_DED=1000000, BPJS_KES_EMP=100000, BPTK=100000
    // HIDUP: BASIC=1400000, ALW1=1000000, ALW2=1000000,
    //        LOAN_DED=2000000, BPJS_KES_EMP=25000, BPTK=52000
    // PRABOWO: BASIC=1200000, ALW2=400000, ALW6=250000, BPTK=5000
  });

  it('should set Payslip Period = 2026 and Month = February', async () => {
    // Semua rows harus payslipPeriod=2026, month="February"
  });

  it('should preserve Employee ID format as string', async () => {
    // '221115-0007' → '221115-0007' (string)
    // '92983-883'   → '92983-883' (string)
    // '7777-6654'   → '7777-6654' (string)
  });
});
```

### 13.4. Manual Test Checklist

| # | Test Case | Expected Result | Pass? |
|---|---|---|---|
| T-01 | Upload file `.xlsx` valid | Konversi berjalan, output didownload | |
| T-02 | Upload file `.csv` | Error: "Format file tidak didukung..." | |
| T-03 | Upload file `.xlsx` tanpa sheet PAYROLL | Error: "Sheet 'PAYROLL' tidak ditemukan..." | |
| T-04 | Upload file `.xlsx` dengan header yang berbeda | Error: "Kolom NIK/NAMA tidak ditemukan..." atau warning ANO-07 | |
| T-05 | Upload file kosong (hanya header, tanpa data) | Summary: 0 karyawan, 0 output rows | |
| T-06 | Input dengan BPTK PPU dan BPU keduanya terisi | Anomaly output dengan ANO-05 | |
| T-07 | Input dengan NIK tanpa dash tapi nama ada | Anomaly output dengan ANO-01 | |
| T-08 | Input dengan NIK duplikat | Anomaly output dengan ANO-08 | |
| T-09 | Verifikasi cell merah di tab Data (anomaly output) | Cell terhighlight + comment visible | |
| T-10 | Verifikasi tab Error (anomaly output) | 8 kolom, data benar | |
| T-11 | Download ulang setelah konversi pertama | File terdownload normal | |
| T-12 | Klik "Konversi file lain" → upload file baru | State reset ke idle, konversi baru jalan | |
| T-13 | Buka di tablet (768px viewport) | Layout responsif, tidak overflow | |
| T-14 | Cek Network tab saat konversi | TIDAK ADA request ke server untuk data payroll | |
| T-15 | Refresh browser setelah konversi | State reset, file sebelumnya TIDAK tersimpan | |

---

## 14. Constraint & Larangan

### 14.1. Data Privacy — WAJIB

| # | Constraint | Implementasi |
|---|---|---|
| P-01 | File input TIDAK boleh dikirim ke server | Semua proses client-side (FileReader API + in-memory) |
| P-02 | File input TIDAK boleh disimpan ke localStorage/IndexedDB | Setelah konversi, `ArrayBuffer` di-release (set `null`) |
| P-03 | File input TIDAK boleh di-commit ke repo | `base/input.xlsx` dan `base/output.xlsx` di `.gitignore` |
| P-04 | TIDAK ada analytics/tracking yang mengirim data payroll | Jika pakai analytics, hanya kirim event name (bukan data) |
| P-05 | TIDAK ada console.log yang print data karyawan di production | Guard dengan `if (import.meta.env.DEV)` |
| P-06 | Output file TIDAK disimpan di server | Blob di-generate client-side, download via `saveAs()` |

### 14.2. Larangan Implementasi

| # | Larangan | Alasan |
|---|---|---|
| L-01 | JANGAN hardcode posisi kolom (misal: `row[29]` untuk GP NEW) | Header bisa bergeser. Gunakan dynamic column mapping |
| L-02 | JANGAN konversi tipe data Employee ID | NIK string harus tetap string. NIK number harus tetap number |
| L-03 | JANGAN buat baris output untuk nilai 0, null, atau non-numerik | Sesuai Rule R3 di ANALYSIS.md |
| L-04 | JANGAN skip anomali secara silent | Semua anomali HARUS dilaporkan ke user |
| L-05 | JANGAN generate output normal jika ada anomali | Jika anomali > 0, SELALU generate error output |
| L-06 | JANGAN pakai backend/API untuk konversi | 100% client-side. GitHub Pages = static hosting |
| L-07 | JANGAN hardcode nama bulan dalam bahasa Indonesia | Output month harus English: January, February, dst. |
| L-08 | JANGAN batch banyak file | MVP: 1 file per konversi |

---

## 15. Checklist Final

Sebelum deploy, pastikan SEMUA item ini terpenuhi:

### Functional
- [ ] Upload `.xlsx` → konversi → download output Works
- [ ] 3 karyawan sample → 18 baris output (exact match dengan output.xlsx)
- [ ] BASIC priority: AF > 0 → pakai AF; AF = 0 → pakai AC
- [ ] BPTK exclusive: hanya 1 dari PPU/BPU yang diambil
- [ ] Zero/null/string → di-skip, tidak menghasilkan baris output
- [ ] Periode → Year (float) + Month (English string)
- [ ] Employee ID preserved apa adanya (string tetap string)
- [ ] Dynamic column mapping (tidak hardcode posisi kolom)
- [ ] Master data validation (semua 17 kode ada di master)
- [ ] Urutan output = urutan di rules (BASIC → ... → BPTK)

### Anomaly Detection
- [ ] ANO-01: NIK tanpa dash terdeteksi
- [ ] ANO-02: Nama kosong terdeteksi
- [ ] ANO-03: Non-numeric value terdeteksi
- [ ] ANO-04: Kode tidak di master terdeteksi
- [ ] ANO-05: Dual BPTK conflict terdeteksi
- [ ] ANO-06: Negative amount terdeteksi (kecuali LOAN_DED, ABS_PROF, ADJ)
- [ ] ANO-07: Header mismatch terdeteksi
- [ ] ANO-08: Duplicate NIK terdeteksi
- [ ] Error output: Tab Data + Tab Error ada dan benar
- [ ] Cell marking merah (`#FFC7CE`) + comment pada tab Data

### UI/UX
- [ ] Single page, 3 state (idle → processing → done)
- [ ] Progress indicator 6 step
- [ ] Conversion summary (jumlah karyawan, rows, skip, anomali)
- [ ] Validation error display yang spesifik
- [ ] Responsive ≥ 768px
- [ ] Security notice visible ("File tidak dikirim ke server")
- [ ] "Konversi file lain" reset state

### Security & Privacy
- [ ] Network tab: ZERO request untuk data payroll
- [ ] localStorage/IndexedDB: KOSONG setelah konversi
- [ ] `.gitignore` berisi `base/input.xlsx` dan `base/output.xlsx`
- [ ] Production build: tidak ada `console.log` data karyawan
- [ ] `sourcemap: false` di production build

### Deployment
- [ ] GitHub Actions workflow berjalan tanpa error
- [ ] GitHub Pages accessible di `https://{username}.github.io/payslip_converter/`
- [ ] Vite `base` path sesuai nama repo
- [ ] Build output < 1MB (tanpa file test data)

---

> **Catatan Akhir**: Dokumen ini adalah **satu-satunya sumber kebenaran** untuk membangun MVP.
> Jika ada konflik antara dokumen ini dengan ANALYSIS.md atau FEATURES.md, ikuti dokumen ini.
> Semua contoh kode di atas bukan final — implementasi boleh berbeda selama **logika dan output identik**.
