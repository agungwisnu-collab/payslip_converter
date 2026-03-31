# Analisis Transformasi Payroll → Other Input Entries

## 1. Ringkasan Umum

Proses ini mengkonversi data payroll dari format **input.xlsx** (format horizontal per karyawan) menjadi format **output.xlsx** / Other Input Entries Import Template (format vertikal multi-baris per komponen gaji), dengan bantuan:
- **rules.xlsx** — definisi mapping kolom input → Other Input Code
- **data helper.xlsx** — master data referensi kode komponen yang valid

### File-File di Folder `base/`

| File | Fungsi | Sheet |
|---|---|---|
| `input.xlsx` | File input utama (PAYROLL) | `PAYROLL` |
| `rules.xlsx` | Definisi aturan mapping kolom → kode output | `Rules` |
| `data helper.xlsx` | Master data Other Input Code yang valid | `Sheet1` |
| `output.xlsx` | Contoh file output yang diharapkan | `Sheet1` |

### Alur Data

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────────┐
│   input.xlsx     │     │  rules.xlsx  │     │ data helper.xlsx │
│   (Input Utama)  │     │  (Rules)     │     │ (Master Data)    │
│   1 row = 1 emp  │     │  Mapping     │     │ Valid codes      │
│   57 kolom       │     │  kolom→code  │     │ 34 records       │
└────────┬─────────┘     └──────┬───────┘     └────────┬─────────┘
         │                      │                      │
         └──────────────┬───────┘──────────────────────┘
                        ▼
              ┌─────────────────────────┐
              │      output.xlsx        │
              │  (Other Input Entries)  │
              │  1 row = 1 komponen     │
              │  6 kolom                │
              │  N rows per karyawan    │
              └─────────────────────────┘
```

---

## 2. Struktur File Input: input.xlsx

- **Sheet**: `PAYROLL`
- **Row 1**: Header kolom utama (57 kolom, A sampai BE)
- **Row 2 s/d Row N**: Data karyawan (1 baris per karyawan)
- **Row setelah data terakhir**: Baris total — col C = "Total Salary" → harus di-SKIP
- **Row 9**: Catatan khusus — col AC9 = _"Jika kolom AF ada isinya, lebih prior diisi yg AF"_
- **Row 15**: Catatan tambahan — col D15 = _"Month"_

### Kolom-Kolom Penting (Row 1 Headers)

| Kolom Excel | No. Kolom | Header | Fungsi |
|---|---|---|---|
| A | 1 | NO | Nomor urut |
| B | 2 | NIK | **Employee ID** (digunakan di output) |
| C | 3 | NAMA | **Employee Name** (digunakan di output) |
| D | 4 | NIK KTP | NIK KTP karyawan |
| E | 5 | nik2 | NIK alternatif |
| F | 6 | DIV | Divisi |
| G | 7 | DEPT | Departemen |
| H | 8 | SECT | Section |
| I | 9 | JAB/PKT | Jabatan/Pangkat |
| J | 10 | GRADE | Grade karyawan |
| K | 11 | JOB TITLE | Judul jabatan |
| L | 12 | EDUCATION FIELD | Pendidikan |
| M | 13 | TANGGAL MASUK | Tanggal mulai kerja (datetime) |
| N | 14 | YEARS IN SERVICES | Masa kerja (string deskriptif) |
| O | 15 | BANK PENERIMA | Bank tujuan transfer |
| P | 16 | NO REKENING | Nomor rekening |
| Q | 17 | NAMA PENERIMA | Nama pemilik rekening |
| R | 18 | HARI MASUK EFEKTIF BULAN INI | HKE bulan berjalan |
| S | 19 | HKE AFTER MAGANG | HKE setelah magang |
| T | 20 | HKE AFTER PROBATION | HKE setelah probation |
| U | 21 | SAKIT (SD) | Hari sakit |
| V | 22 | IJIN TIDAK DIBAYAR | Hari ijin tidak dibayar |
| W | 23 | REP TELAT | Rekapitulasi telat |
| X | 24 | ALPHA | Hari alpha |
| Y | 25 | LEMBUR (JAM) | Jam lembur |
| Z | 26 | CUTI | Hari cuti |
| AA | 27 | CUTI BONUS | Cuti bonus |
| **AB** | **28** | **PERIODE** | **Periode payroll (datetime, format `mmm-yy`) → source Payslip Period & Month** |
| **AC** | **29** | **GP NEW** | **Gaji pokok baru → BASIC (default jika AF = 0)** |
| AD | 30 | GAJI BULAN SEBELUMNYA (Proporsional) | Gaji proporsional bulan lalu |
| AE | 31 | GAJI BULAN INI (Proporsional) | Gaji proporsional bulan ini |
| **AF** | **32** | **TOTAL GAJI PROPORSIONAL** | **Total gaji proporsional → BASIC (PRIORITAS jika > 0)** |
| **AG** | **33** | **T. JABATAN** | **Tunjangan Jabatan → ALW1** |
| **AH** | **34** | **T. KEHADIRAN** | **Tunjangan Kehadiran → ALW2** |
| **AI** | **35** | **T. PROFESI** | **Tunjangan Profesi → ALW3** |
| **AJ** | **36** | **T. CASTING** | **Tunjangan Casting → ALW6** |
| **AK** | **37** | **T. PENUGASAN** | **Tunjangan Penugasan → ALW7** |
| **AL** | **38** | **T. BEBAN KERJA** | **Tunjangan Beban Kerja → PPH21_TER_ALW** |
| **AM** | **39** | **U. SEWA KEND** | **Uang Sewa Kendaraan → SWM** |
| **AN** | **40** | **KEKURANGAN GAJI** | **Kekurangan gaji → ADJ** |
| **AO** | **41** | **REIMBURSEMENT KESEHATAN** | **Reimbursement kes. → AET** |
| **AP** | **42** | **LEMBUR** | **Nominal lembur → OVT** |
| AQ | 43 | GET POIN KPI | Poin KPI (tidak di-export) |
| AR | 44 | PENGKALI | Pengkali (tidak di-export) |
| **AS** | **45** | **BONUS SALES (Rp)** | **Bonus sales → BONUS** |
| **AT** | **46** | **KEBIJAKAN CEO** | **Kebijakan CEO → CEO** |
| **AU** | **47** | **CICILAN PINJAMAN** | **Cicilan pinjaman → LOAN_DED** |
| **AV** | **48** | **POTONGAN ABSEN KEHDRAN & PROFESI** | **Potongan absensi → ABS_PROF** |
| **AW** | **49** | **BPJS KESEHATAN** | **BPJS Kes. Employee → BPJS_KES_EMP** |
| **AX** | **50** | **BPJS TK PPU** | **BPJS TK PPU → BPTK** |
| **AY** | **51** | **BPJS TK BPU (KHUSUS CS KEMITRAAN)** | **BPJS TK BPU → BPTK (sama kode dengan AX)** |
| AZ | 52 | LAIN LAIN (Potongan PPh 21 Periode Gaji Dec-24) | Tidak di-export langsung |
| BA | 53 | THP NEW NEW | Take Home Pay — total kalkulasi (tidak di-export) |
| BB | 54 | ROUNDING | Pembulatan THP (tidak di-export) |
| BC | 55 | ENTITAS BARU UPDATE | Entitas perusahaan |
| BE | 57 | ENTITAS UPDATE FROM MASTER DATA | Entitas dari master data |

### Data Sample (3 Karyawan)

| Row | NIK (B) | NAMA (C) | GRADE (J) | Tipe NIK |
|---|---|---|---|---|
| 2 | `'221115-0007'` | TIFA LOCKHEART | _(kosong)_ | String |
| 3 | `'92983-883'` | HIDUP JOKOWEE | PROBATION | String |
| 4 | `'7777-6654'` | PRABOWO SUGIANTORO | MITRA | String |

---

## 3. Struktur File Rules: rules.xlsx

- **Sheet**: `Rules`
- **Row 1**: Judul — "Rules :"
- **Row 2**: Header — Kolom Input | Kolom Output | Keterangan
- **Row 3-23**: 21 baris aturan mapping

### Tabel Rules Lengkap

| # | Kolom Input (A) | Kolom Output (B) | Keterangan (C) |
|---|---|---|---|
| 1 | NIK | Employee ID | |
| 2 | PERIODE | Payslip Period & Month | |
| 3 | GP NEW | Other Input Code - BASIC | |
| 4 | TOTAL GAJI PROPORSIONAL | Other Input Code - BASIC | **High Priority dibanding GP New** |
| 5 | T. JABATAN | Other Input Code - ALW1 | |
| 6 | T. KEHADIRAN | Other Input Code - ALW2 | |
| 7 | T. PROFESI | Other Input Code - ALW3 | |
| 8 | T. CASTING | Other Input Code - ALW6 | |
| 9 | T. PENUGASAN | Other Input Code - ALW7 | |
| 10 | T. BEBAN KERJA | Other Input Code - PPH21_TER_ALW | |
| 11 | U. SEWA KEND | Other Input Code - SWM | |
| 12 | KEKURANGAN GAJI | Other Input Code - ADJ | |
| 13 | REIMBURSEMENT KESEHATAN | Other Input Code - AET | |
| 14 | LEMBUR | Other Input Code - OVT | |
| 15 | BONUS SALES (Rp) | Other Input Code - BONUS | |
| 16 | KEBIJAKAN CEO | Other Input Code - CEO | |
| 17 | CICILAN PINJAMAN | Other Input Code - LOAN_DED | |
| 18 | POTONGAN ABSEN KEHDRAN & PROFESI | Other Input Code - ABS_PROF | |
| 19 | BPJS KESEHATAN | Other Input Code - BPJS_KES_EMP | |
| 20 | BPJS TK PPU | Other Input Code - BPTK | |
| 21 | BPJS TK BPU ( KHUSUS CS KEMITRAAN) | Other Input Code - BPTK | Sama kode dengan PPU |

> **Insight**: File rules.xlsx secara eksplisit mendefinisikan bahwa `TOTAL GAJI PROPORSIONAL` memiliki **"High Priority dibanding GP New"** untuk kode BASIC.

---

## 4. Struktur File Master Data: data helper.xlsx

- **Sheet**: `Sheet1`
- **Total**: 34 record
- **Kolom**: Description (A) | Code (B) | Input Type (C) | Company (D)
- **Semua Input Type**: `Manual Entries`
- **Semua Company**: `PT Etos Kreatif Indonesia`

### Tabel Master Data Lengkap

| # | Description | Code | Digunakan di Rules? |
|---|---|---|---|
| 1 | Bonus | BONUS | ✅ |
| 2 | Bingkisan | BINGKISAN | ❌ |
| 3 | Reimbursement Kesehatan | AET | ✅ |
| 4 | Tali Asih | TA | ❌ |
| 5 | Reward Weekly | RW | ❌ |
| 6 | Fee Host Live | FHL | ❌ |
| 7 | Fee Talent Live | FTL | ❌ |
| 8 | Biaya Sewa Rumah / Kontrakan | SWR | ❌ |
| 9 | Sewa Mobil | SWM | ✅ |
| 10 | Basic Salary | BASIC | ✅ |
| 11 | Overtime | OVT | ✅ |
| 12 | THR | THR | ❌ |
| 13 | Tunjangan PPH21 TER | PPH21_TER_ALW | ✅ |
| 14 | Bonus (AI) | AI | ❌ |
| 15 | Tunjangan Kehadiran | ALW2 | ✅ |
| 16 | Tunjangan Profesi | ALW3 | ✅ |
| 17 | Tunjangan Casting | ALW6 | ✅ |
| 18 | JKK | JKK | ❌ |
| 19 | JKM | JKM | ❌ |
| 20 | BPJS Kesehatan Company | BPJS_KES_CO | ❌ |
| 21 | JHT Company | JHT_CO | ❌ |
| 22 | Jaminan Pensiun Company | JP_CO | ❌ |
| 23 | Potongan Absensi | ABS_PROF | ✅ |
| 24 | BPJS Kesehatan Employee | BPJS_KES_EMP | ✅ |
| 25 | Jaminan Hari Tua Employee | JHT_EMP | ❌ |
| 26 | Jaminan Pensiun Employee | JP_EMP | ❌ |
| 27 | BPJSTK PPU | BPTK | ✅ |
| 28 | Loan Deduction | LOAN_DED | ✅ |
| 29 | PPH21 TER | PPH21_TER | ❌ |
| 30 | Manual Overtime Input | OVT_ALW | ❌ |
| 31 | Tunjangan Jabatan | ALW1 | ✅ |
| 32 | Tunjangan Penugasan | ALW7 | ✅ |
| 33 | Kekurangan Gaji | ADJ | ✅ |
| 34 | Kebijakan CEO | CEO | ✅ |

> **Catatan**: Dari 34 kode master, hanya **17 kode** yang digunakan dalam mapping rules.
> 17 kode lainnya (BINGKISAN, TA, RW, FHL, FTL, SWR, THR, AI, JKK, JKM, BPJS_KES_CO,
> JHT_CO, JP_CO, JHT_EMP, JP_EMP, PPH21_TER, OVT_ALW) tidak ter-mapping dari kolom input payroll.

---

## 5. Struktur File Output: output.xlsx

- **Sheet**: `Sheet1`
- **Row 1**: Header (6 kolom)
- **Row 2 s/d Row N**: Data output (1 baris per komponen gaji per karyawan)
- **Total sample**: 18 baris data untuk 3 karyawan
- **6 Kolom**:

| Kolom | Header | Tipe Data | Sumber |
|---|---|---|---|
| A | Employee | String | Kolom C (NAMA) dari input |
| B | Employee ID | String/Number | Kolom B (NIK) dari input — format dipertahankan apa adanya |
| C | Other Input Code | String | Kode dari rules.xlsx, divalidasi terhadap data helper.xlsx |
| D | Payslip Period | Float (tahun) | `YEAR(PERIODE)` → contoh: `2026.0` |
| E | Month | String | Nama bulan English → contoh: `February` |
| F | Amount | Float | Nilai numerik dari kolom payroll yang sesuai |

### Format Output

Setiap karyawan menghasilkan **N baris** di output, di mana N = jumlah komponen gaji yang memiliki nilai > 0 (non-null, non-zero).

---

## 6. Aturan Transformasi (Transformation Rules)

### 6.1. Identifikasi Baris Karyawan

- Data karyawan dimulai dari **Row 2** (Row 1 = header)
- Baris karyawan valid diidentifikasi dari:
  - Kolom **B (NIK)** harus berformat **dash** (mengandung karakter `-`), contoh: `'1234-5678'`
  - Kolom **C (Nama Karyawan)** harus **tidak kosong**
- **SKIP baris** jika NIK tidak mengandung dash **dan** nama kosong (baris total, catatan, baris kosong)
- Iterasi semua baris dari Row 2 sampai row terakhir yang berisi data

### 6.2. Derivasi Payslip Period & Month

Dari kolom **AB (PERIODE)** yang berisi datetime (format Excel `mmm-yy`):
- **Payslip Period** = `YEAR(PERIODE)` → contoh: `2026` (disimpan sebagai float `2026.0` di output)
- **Month** = `MONTHNAME(PERIODE)` → nama bulan dalam **bahasa Inggris**: `January`, `February`, dst.

> Contoh: PERIODE = `datetime(2026, 2, 25)` → Payslip Period = `2026.0`, Month = `February`

### 6.3. Mapping Kolom Payroll → Other Input Code (dari rules.xlsx)

| Kolom Input | Header Input | Other Input Code | Prioritas/Catatan |
|---|---|---|---|
| AC (29) | GP NEW | **BASIC** | Default — digunakan jika AF = 0 |
| AF (32) | TOTAL GAJI PROPORSIONAL | **BASIC** | **PRIORITAS UTAMA** jika nilainya > 0 (rules.xlsx: "High Priority dibanding GP New") |
| AG (33) | T. JABATAN | **ALW1** | Tunjangan jabatan |
| AH (34) | T. KEHADIRAN | **ALW2** | Tunjangan kehadiran |
| AI (35) | T. PROFESI | **ALW3** | Tunjangan profesi |
| AJ (36) | T. CASTING | **ALW6** | Tunjangan casting |
| AK (37) | T. PENUGASAN | **ALW7** | Tunjangan penugasan |
| AL (38) | T. BEBAN KERJA | **PPH21_TER_ALW** | Tunjangan beban kerja |
| AM (39) | U. SEWA KEND | **SWM** | Uang sewa kendaraan |
| AN (40) | KEKURANGAN GAJI | **ADJ** | Kekurangan/adjustment gaji |
| AO (41) | REIMBURSEMENT KESEHATAN | **AET** | Reimbursement kesehatan |
| AP (42) | LEMBUR | **OVT** | Nominal lembur |
| AS (45) | BONUS SALES (Rp) | **BONUS** | Bonus penjualan |
| AT (46) | KEBIJAKAN CEO | **CEO** | Kebijakan khusus CEO |
| AU (47) | CICILAN PINJAMAN | **LOAN_DED** | Potongan cicilan pinjaman |
| AV (48) | POTONGAN ABSEN KEHDRAN & PROFESI | **ABS_PROF** | Potongan absensi/kehadiran & profesi |
| AW (49) | BPJS KESEHATAN | **BPJS_KES_EMP** | BPJS Kesehatan (bagian karyawan) |
| AX (50) | BPJS TK PPU | **BPTK** | BPJS TK untuk pegawai PPU |
| AY (51) | BPJS TK BPU (KHUSUS CS KEMITRAAN) | **BPTK** | BPJS TK untuk mitra/BPU — output kode SAMA |

### 6.4. Aturan Khusus (Special Rules)

#### Rule 1: Prioritas BASIC Salary

```
JIKA AF (TOTAL GAJI PROPORSIONAL) > 0:
    BASIC = nilai AF
SELAIN ITU:
    BASIC = nilai AC (GP NEW)
```

> **Sumber**: rules.xlsx Row 6 Col C = _"High Priority dibanding GP New"_
>
> **Logika bisnis**: Jika karyawan masuk/keluar di tengah bulan, gajinya dihitung proporsional
> (AD + AE). Jika proporsional > 0, gunakan itu sebagai BASIC. Jika tidak (karyawan full bulan),
> gunakan GP NEW.

#### Rule 2: BPTK (BPJS Tenaga Kerja) — Dua Source, Satu Code

```
JIKA AX (BPJS TK PPU) memiliki nilai > 0:
    BPTK = nilai AX
SELAIN ITU JIKA AY (BPJS TK BPU) memiliki nilai > 0:
    BPTK = nilai AY
```

> **Logika bisnis**: Karyawan PPU (Penerima Upah/karyawan tetap) menggunakan Col AX.
> Karyawan BPU/Kemitraan (bukan penerima upah) menggunakan Col AY.
> Keduanya saling eksklusif — hanya satu yang akan terisi per karyawan.

#### Rule 3: Filtering — Hanya Nilai Non-Zero & Numerik

```
UNTUK setiap kolom yang di-mapping:
    JIKA nilai = None ATAU nilai = 0 ATAU nilai = "" ATAU bukan numerik:
        SKIP (tidak buat baris output)
    SELAIN ITU:
        Buat 1 baris output
```

> Kolom dengan nilai 0, None, kosong, atau teks non-numerik **TIDAK** menghasilkan baris di output.

#### Rule 4: Kolom yang TIDAK Di-Export

Kolom berikut **tidak** di-mapping ke output meskipun berisi data:

| Kolom | Header | Alasan |
|---|---|---|
| A-AA (1-27) | Data identitas & attendance | Informational — tidak ada di rules.xlsx |
| AD-AE (30-31) | Gaji Proporsional (komponen) | Sudah terakumulasi di AF (Total Gaji Proporsional) |
| AQ (43) | GET POIN KPI | Parameter perhitungan, bukan komponen gaji |
| AR (44) | PENGKALI | Parameter perhitungan, bukan komponen gaji |
| AZ (52) | LAIN LAIN | Tidak di-mapping di rules.xlsx |
| BA (53) | THP NEW NEW | Hasil kalkulasi total, bukan input |
| BB (54) | ROUNDING | Pembulatan THP, bukan input |
| BC-BE (55-57) | ENTITAS | Informasi entitas perusahaan |

#### Rule 5: Value Filtering per Tipe Data

```
UNTUK setiap cell:
    JIKA value = None          → SKIP (cell kosong)
    JIKA value = 0             → SKIP (nol eksplisit)
    JIKA value = '' (empty)    → SKIP
    JIKA value bukan numerik   → SKIP (string atau tipe lain)
    JIKA value = numeric > 0   → OUTPUT (buat baris)
    JIKA value = numeric < 0   → OUTPUT (buat baris — misal potongan negatif)
```

---

## 7. Urutan Output per Karyawan

Berdasarkan analisis output.xlsx, urutan komponen gaji dalam output mengikuti **urutan mapping di rules.xlsx** (yang mengikuti urutan kolom input dari kiri ke kanan):

```
BASIC → ALW1 → ALW2 → ALW3 → ALW6 → ALW7 → PPH21_TER_ALW → SWM → ADJ → AET → OVT → BONUS → CEO → LOAN_DED → ABS_PROF → BPJS_KES_EMP → BPTK
```

(Hanya komponen yang bernilai numerik > 0 yang muncul di output)

---

## 8. Contoh Transformasi (Verifikasi Input vs Output)

### Karyawan 1: TIFA LOCKHEART (NIK: '221115-0007') — Row 2

**Input values (data_only=True):**
| Kolom | Header | Nilai |
|---|---|---|
| AC | GP NEW | 7,500,000 |
| AF | TOTAL GAJI PROPORSIONAL | 0 |
| AG | T. JABATAN | 10,000,000 |
| AK | T. PENUGASAN | 2,000,000 |
| AL | T. BEBAN KERJA | 0 |
| AO | REIMBURSEMENT KESEHATAN | 1,500,000 |
| AT | KEBIJAKAN CEO | 50,000,000 |
| AU | CICILAN PINJAMAN | 1,000,000 |
| AW | BPJS KESEHATAN | 100,000 |
| AX | BPJS TK PPU | 100,000 |
| _AH, AI, AJ, AM, AN, AP, AS, AV, AY_ | _lainnya_ | _None_ |

**Output rows (output.xlsx Row 2-9):**
| Other Input Code | Amount | Sumber | Verifikasi |
|---|---|---|---|
| BASIC | 7,500,000 | AC (AF=0 → fallback ke AC) | ✅ |
| ALW1 | 10,000,000 | AG | ✅ |
| ALW7 | 2,000,000 | AK | ✅ |
| AET | 1,500,000 | AO | ✅ |
| CEO | 50,000,000 | AT | ✅ |
| LOAN_DED | 1,000,000 | AU | ✅ |
| BPJS_KES_EMP | 100,000 | AW | ✅ |
| BPTK | 100,000 | AX (PPU) | ✅ |

**Total baris output: 8** ✅

---

### Karyawan 2: HIDUP JOKOWEE (NIK: '92983-883') — Row 3

**Input values (data_only=True):**
| Kolom | Header | Nilai |
|---|---|---|
| AC | GP NEW | 1,400,000 |
| AF | TOTAL GAJI PROPORSIONAL | 0 |
| AG | T. JABATAN | 1,000,000 |
| AH | T. KEHADIRAN | 1,000,000 |
| AU | CICILAN PINJAMAN | 2,000,000 |
| AW | BPJS KESEHATAN | 25,000 |
| AX | BPJS TK PPU | 52,000 |
| _AI, AJ, AK, AL, AM, AN, AO, AP, AS, AT, AV, AY_ | _lainnya_ | _None_ |

**Output rows (output.xlsx Row 10-15):**
| Other Input Code | Amount | Sumber | Verifikasi |
|---|---|---|---|
| BASIC | 1,400,000 | AC (AF=0 → fallback ke AC) | ✅ |
| ALW1 | 1,000,000 | AG | ✅ |
| ALW2 | 1,000,000 | AH | ✅ |
| LOAN_DED | 2,000,000 | AU | ✅ |
| BPJS_KES_EMP | 25,000 | AW | ✅ |
| BPTK | 52,000 | AX (PPU) | ✅ |

**Total baris output: 6** ✅

---

### Karyawan 3: PRABOWO SUGIANTORO (NIK: '7777-6654') — Row 4

**Input values (data_only=True):**
| Kolom | Header | Nilai |
|---|---|---|
| AC | GP NEW | 1,200,000 |
| AE | GAJI BULAN INI | 0 |
| AF | TOTAL GAJI PROPORSIONAL | 0 |
| AG | T. JABATAN | 0 |
| AH | T. KEHADIRAN | 400,000 |
| AI | T. PROFESI | 0 |
| AJ | T. CASTING | 250,000 |
| AT | KEBIJAKAN CEO | 0 |
| AV | POTONGAN ABSEN | 0 |
| AW | BPJS KESEHATAN | 0 |
| AY | BPJS TK BPU | 5,000 |
| _AX (BPJS TK PPU)_ | — | _None (Karyawan MITRA pakai BPU/AY)_ |

**Output rows (output.xlsx Row 16-19):**
| Other Input Code | Amount | Sumber | Verifikasi |
|---|---|---|---|
| BASIC | 1,200,000 | AC (AF=0 → fallback ke AC) | ✅ |
| ALW2 | 400,000 | AH | ✅ |
| ALW6 | 250,000 | AJ | ✅ |
| BPTK | 5,000 | AY (BPU — karyawan MITRA) | ✅ |

**Total baris output: 4** ✅

---

## 9. Anomali & Catatan Penting

### Anomali 1: Employee ID — NIK PRABOWO Berbeda antara Input dan Output

| Karyawan | NIK di Input | Tipe Python | NIK di Output | Tipe Python |
|---|---|---|---|---|
| TIFA LOCKHEART | `'221115-0007'` | `str` | `'221115-0007'` | `str` |
| HIDUP JOKOWEE | `'92983-883'` | `str` | `'92983-883'` | `str` |
| PRABOWO SUGIANTORO | `'7777-6654'` | `str` | `77776654.0` | `float` |

> **Temuan**: NIK PRABOWO di input = `'7777-6654'` (string dengan dash), sedangkan di output = `77776654.0` (float tanpa dash).
> Kemungkinan besar output.xlsx dibuat dari versi input yang berbeda di mana NIK PRABOWO berisi angka `77776654`.
>
> **Rekomendasi**: Converter harus mempertahankan nilai Employee ID apa adanya dari input (tanpa konversi tipe data).
> Jika NIK berupa string, tulis sebagai string. Jika NIK berupa number, tulis sebagai number.

---

## 10. Pseudocode Konversi

```python
INPUT  = load("input.xlsx", sheet="PAYROLL", data_only=True)
RULES  = load("rules.xlsx", sheet="Rules")
MASTER = load("data helper.xlsx", sheet="Sheet1")

# Build mapping dari rules.xlsx (row 5-23, skip row 3=NIK dan row 4=PERIODE)
# Format: header_input → other_input_code
MAPPING_ORDER = [
    # (kolom_excel_index, kode_output, header_input)
    (29, "BASIC",         "GP NEW"),           # AC — fallback
    (33, "ALW1",          "T. JABATAN"),        # AG
    (34, "ALW2",          "T. KEHADIRAN"),      # AH
    (35, "ALW3",          "T. PROFESI"),        # AI
    (36, "ALW6",          "T. CASTING"),        # AJ
    (37, "ALW7",          "T. PENUGASAN"),      # AK
    (38, "PPH21_TER_ALW", "T. BEBAN KERJA"),   # AL
    (39, "SWM",           "U. SEWA KEND"),      # AM
    (40, "ADJ",           "KEKURANGAN GAJI"),   # AN
    (41, "AET",           "REIMBURSEMENT KESEHATAN"), # AO
    (42, "OVT",           "LEMBUR"),            # AP
    (45, "BONUS",         "BONUS SALES (Rp)"),  # AS
    (46, "CEO",           "KEBIJAKAN CEO"),     # AT
    (47, "LOAN_DED",      "CICILAN PINJAMAN"),  # AU
    (48, "ABS_PROF",      "POTONGAN ABSEN KEHDRAN & PROFESI"), # AV
    (49, "BPJS_KES_EMP",  "BPJS KESEHATAN"),   # AW
    (50, "BPTK",          "BPJS TK PPU"),       # AX
    (51, "BPTK",          "BPJS TK BPU"),       # AY — sama kode
]

# Validasi: semua kode ada di MASTER
valid_codes = set(MASTER["Code"])

OUTPUT = []

FOR each employee_row in INPUT (Row 2..last_row):
    employee_name = row[C]   # col 3
    employee_id   = row[B]   # col 2
    
    # RULE 7: Skip row — NIK tanpa dash DAN nama kosong
    nik_has_dash = isinstance(employee_id, str) AND '-' IN employee_id
    name_filled  = employee_name IS NOT None AND str(employee_name).strip() != ''
    IF NOT nik_has_dash AND NOT name_filled:
        CONTINUE
    periode       = row[AB]  # col 28, datetime
    payslip_year  = YEAR(periode)        # → 2026.0
    payslip_month = MONTHNAME(periode)   # → "February"

    # ──── RULE 1: Tentukan BASIC ────
    af_value = row[AF]  # col 32
    ac_value = row[AC]  # col 29
    
    IF is_numeric(af_value) AND af_value > 0:
        basic_value = af_value       # AF has priority
    ELSE:
        basic_value = ac_value       # Fallback ke GP NEW
    
    IF is_numeric(basic_value) AND basic_value > 0:
        ASSERT "BASIC" IN valid_codes
        OUTPUT.append(employee_name, employee_id, "BASIC", payslip_year, payslip_month, basic_value)

    # ──── Proses mapping lainnya (skip BASIC) ────
    bptk_already_added = False
    
    FOR each (col_idx, code, header) in MAPPING_ORDER:
        IF code == "BASIC":
            CONTINUE  # Sudah diproses di atas
        
        value = row[col_idx]
        
        # RULE 3: Filter non-numeric dan zero
        IF NOT is_numeric(value) OR value == 0:
            CONTINUE
        
        # RULE 2: BPTK mutually exclusive
        IF code == "BPTK":
            IF bptk_already_added:
                CONTINUE
            bptk_already_added = True
        
        # Validasi terhadap master data
        ASSERT code IN valid_codes
        OUTPUT.append(employee_name, employee_id, code, payslip_year, payslip_month, value)

WRITE OUTPUT to Excel with columns:
    [Employee, Employee ID, Other Input Code, Payslip Period, Month, Amount]
```

### Helper: `is_numeric(value)`
```python
def is_numeric(value):
    """Return True if value is a valid number (int or float), not None, not string."""
    if value is None:
        return False
    if isinstance(value, (int, float)):
        return True
    if isinstance(value, str):
        return False
    return False
```

---

## 11. Validasi Kode dengan Master Data (data helper.xlsx)

Semua Other Input Code yang digunakan di output **harus ada** di file `data helper.xlsx`:

| Code Output | Ada di Master? | Description di Master |
|---|---|---|
| BASIC | ✅ | Basic Salary |
| ALW1 | ✅ | Tunjangan Jabatan |
| ALW2 | ✅ | Tunjangan Kehadiran |
| ALW3 | ✅ | Tunjangan Profesi |
| ALW6 | ✅ | Tunjangan Casting |
| ALW7 | ✅ | Tunjangan Penugasan |
| PPH21_TER_ALW | ✅ | Tunjangan PPH21 TER |
| SWM | ✅ | Sewa Mobil |
| ADJ | ✅ | Kekurangan Gaji |
| AET | ✅ | Reimbursement Kesehatan |
| OVT | ✅ | Overtime |
| BONUS | ✅ | Bonus |
| CEO | ✅ | Kebijakan CEO |
| LOAN_DED | ✅ | Loan Deduction |
| ABS_PROF | ✅ | Potongan Absensi |
| BPJS_KES_EMP | ✅ | BPJS Kesehatan Employee |
| BPTK | ✅ | BPJSTK PPU |

---

## 12. Ringkasan Rules

| # | Rule | Deskripsi | Sumber |
|---|---|---|---|
| R1 | BASIC Priority | Jika AF (Total Gaji Proporsional) > 0, pakai AF. Jika tidak, pakai AC (GP NEW) | rules.xlsx Row 6 Col C |
| R2 | BPTK Exclusive | AX (PPU) dan AY (BPU) keduanya map ke BPTK. Hanya satu yang terisi per karyawan (saling eksklusif) | rules.xlsx Row 22-23 |
| R3 | Zero/Null/Non-Numeric Filter | Nilai `0`, `None`, `''`, atau non-numerik → tidak menghasilkan baris output | Dibuktikan dari verifikasi output.xlsx |
| R4 | Urutan Output | Mengikuti urutan mapping di rules.xlsx (= urutan kolom input kiri→kanan) | Dibuktikan dari output.xlsx |
| R5 | Periode Derivation | `Payslip Period = YEAR(PERIODE)`, `Month = MONTHNAME(PERIODE)` dalam bahasa Inggris | rules.xlsx Row 4 |
| R6 | Employee ID Format | Tipe data asli dipertahankan apa adanya dari input | Dibuktikan dari output.xlsx |
| R7 | Skip Rows | Skip baris jika NIK (col B) tidak mengandung dash (`-`) **dan** Nama (col C) kosong. Ini mencakup baris total, catatan, dan baris kosong | Dibuktikan dari input.xlsx |
| R8 | Master Validation | Semua Other Input Code harus ada di data helper.xlsx sebelum ditulis ke output | data helper.xlsx sebagai referensi valid codes |
