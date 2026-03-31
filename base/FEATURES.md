# Feature Requirements — Payslip Converter Website

> Dokumen ini mendefinisikan fitur **Must Have** dan **Nice to Have** untuk website converter
> yang mentransformasi file payroll (format horizontal) menjadi Other Input Entries Import Template
> (format vertikal) sesuai spesifikasi di [ANALYSIS.md](ANALYSIS.md).
>
> **Konsep utama**: User hanya upload 1 file input. File rules dan data helper sudah
> di-bundle dalam sistem. Jika ada anomali, output berupa file input + tab Error.

---

## 1. Must Have (MVP)

### 1.1. Upload & Input

| ID | Fitur | Deskripsi |
|---|---|---|
| M-01 | Upload Input File | Upload file payroll (`.xlsx`) sebagai sumber data utama. Validasi ekstensi `.xlsx` / `.xls`. Maksimal 1 file per konversi. |
| M-02 | Embedded Rules | File `rules.xlsx` di-bundle di dalam sistem (server-side). User **tidak** perlu upload. Dikelola oleh admin/developer. |
| M-03 | Embedded Data Helper | File `data helper.xlsx` di-bundle di dalam sistem (server-side). User **tidak** perlu upload. Dikelola oleh admin/developer. |
| M-04 | Validasi Format Input | Sebelum proses, validasi bahwa file input memiliki sheet `PAYROLL` dan header Row 1 sesuai ekspektasi. Tampilkan error message yang jelas dan spesifik jika gagal. |

### 1.2. Core Conversion Engine

| ID | Fitur | Deskripsi |
|---|---|---|
| M-05 | Parsing Input Payroll | Baca file input dengan `data_only=True` (value only, abaikan formula). Header di Row 1. Data karyawan mulai Row 2. |
| M-06 | Skip Row Logic | Skip baris jika kolom NIK (B) **tidak mengandung dash** (`-`) **dan** kolom Nama (C) kosong. Mencakup baris total, baris catatan, dan baris kosong. |
| M-07 | Dynamic Column Mapping | Bangun mapping dari file rules.xlsx secara dinamis. Tidak hardcode kolom — posisi kolom ditentukan dengan mencocokkan header name dari rules ke header Row 1 input. |
| M-08 | BASIC Priority Rule | Jika `TOTAL GAJI PROPORSIONAL` (AF) > 0, gunakan sebagai BASIC. Jika tidak, fallback ke `GP NEW` (AC). Sesuai rules.xlsx "High Priority". |
| M-09 | BPTK Exclusive Rule | `BPJS TK PPU` (AX) dan `BPJS TK BPU` (AY) keduanya map ke kode `BPTK`. Hanya satu yang boleh terisi per karyawan — ambil yang pertama ditemukan > 0. |
| M-10 | Zero/Null/Non-Numeric Filter | Hanya buat baris output untuk cell yang bernilai numerik dan ≠ 0. Skip `None`, `0`, `""`, string, atau tipe non-numerik lainnya. |
| M-11 | Periode Derivation | Dari kolom PERIODE (datetime): extract `Payslip Period = YEAR` (float), `Month = nama bulan English` (e.g. `February`). |
| M-12 | Master Data Validation | Validasi setiap Other Input Code terhadap kode di data helper. Jika ada kode yang tidak ditemukan di master, tampilkan warning (jangan silent skip). |
| M-13 | Output Row Ordering | Urutan baris output per karyawan mengikuti urutan mapping di rules.xlsx (kiri → kanan sesuai kolom input). |
| M-14 | Employee ID Preservation | Pertahankan format dan tipe data NIK apa adanya dari input. Jangan konversi string → number atau sebaliknya. |

### 1.3. Output Generation

| ID | Fitur | Deskripsi |
|---|---|---|
| M-15 | Generate Output Excel (Success) | Jika **tidak ada anomali**: hasilkan file `.xlsx` dengan 6 kolom: `Employee`, `Employee ID`, `Other Input Code`, `Payslip Period`, `Month`, `Amount`. Header di Row 1, data mulai Row 2. |
| M-16 | Generate Output Excel (Anomaly) | Jika **ada anomali/ketidaksesuaian data**: hasilkan file `.xlsx` yang berisi **data input apa adanya** ditambah **tab `Error`** berisi detail kendala. Cell yang terindikasi anomali pada tab data **ditandai** (highlight warna / comment). Lihat [Section 1.6](#16-anomaly--error-output) untuk detail. |
| M-17 | Download Output File | Tombol download untuk mengunduh file hasil konversi. Nama file otomatis: `Other_Input_Entries_{periode}_{timestamp}.xlsx` (success) atau `Conversion_Error_{timestamp}.xlsx` (anomaly). |

### 1.4. Feedback & Progress

| ID | Fitur | Deskripsi |
|---|---|---|
| M-18 | Progress Indicator | Tampilkan progress real-time selama konversi: (1) Upload ✓ → (2) Validasi ✓ → (3) Parsing data... → (4) Mapping komponen... → (5) Generating output... → (6) Selesai ✓. Gunakan progress bar atau step indicator agar user tahu posisi proses saat ini. |
| M-19 | Conversion Summary | Setelah konversi selesai, tampilkan ringkasan: jumlah karyawan diproses, jumlah baris output dihasilkan, jumlah baris di-skip (beserta alasan), jumlah anomali ditemukan (jika ada). |
| M-20 | Validation Error Display | Jika file input tidak valid (ekstensi salah, sheet tidak ditemukan, header tidak cocok), tampilkan pesan error yang spesifik dan actionable — bukan generic "Something went wrong". Proses STOP, tidak menghasilkan file output. |

### 1.5. UI/UX Dasar

| ID | Fitur | Deskripsi |
|---|---|---|
| M-21 | Single Page Application | Semua proses (upload → progress → download) dalam satu halaman tanpa navigasi kompleks. |
| M-22 | Responsive Layout | Tampilan responsif untuk desktop dan tablet. Minimum viewport: 768px. |

### 1.6. Anomaly & Error Output

Jika ditemukan **ketidaksesuaian data atau anomali** saat konversi, sistem **tidak** menghasilkan output normal. Sebagai gantinya:

| ID | Fitur | Deskripsi |
|---|---|---|
| M-23 | Error Tab pada Output | File output berisi **2 tab**: (1) Tab `Data` = salinan data input apa adanya, (2) Tab `Error` = tabel detail anomali yang ditemukan. |
| M-24 | Detail Anomali di Tab Error | Tab `Error` berisi kolom: `Row`, `Column`, `Employee Name`, `NIK`, `Field`, `Value`, `Error Type`, `Description`. Setiap anomali = 1 baris. |
| M-25 | Cell Marking pada Tab Data | Cell yang terindikasi anomali pada tab `Data` diberi **highlight merah** (fill color `#FFC7CE`) dan **comment** berisi penjelasan singkat error-nya. User bisa langsung lihat cell mana yang bermasalah. |
| M-26 | Tipe Anomali yang Dideteksi | Deteksi anomali meliputi: |

**Daftar Tipe Anomali:**

| Kode | Tipe Anomali | Deskripsi | Contoh |
|---|---|---|---|
| `ANO-01` | NIK tanpa dash | NIK tidak mengandung `-` tapi Nama terisi (baris tetap diproses tapi ditandai) | NIK = `77776654`, Nama = `PRABOWO` |
| `ANO-02` | Nama kosong | NIK valid (ada dash) tapi Nama kosong | NIK = `1234-5678`, Nama = `` |
| `ANO-03` | Non-numeric value | Cell yang seharusnya numerik berisi teks/karakter | T.Kehadiran = `abc` |
| `ANO-04` | Kode tidak di master | Other Input Code dari rules tidak ditemukan di data helper | Code = `XYZ99` |
| `ANO-05` | Dual BPTK conflict | Kedua kolom `BPJS TK PPU` dan `BPJS TK BPU` terisi > 0 untuk karyawan yang sama | PPU = 200000, BPU = 150000 |
| `ANO-06` | Negative amount | Nilai amount negatif (yang tidak seharusnya, kecuali kolom adjustment/loan) | BASIC = -5000000 |
| `ANO-07` | Header mismatch | Header kolom input tidak cocok dengan mapping di rules.xlsx | Rules expects `GP NEW`, input has `GAJI POKOK BARU` |
| `ANO-08` | Duplicate NIK | NIK yang sama muncul lebih dari 1x di file input | 2 baris dengan NIK `1234-5678` |

### 1.7. Alur Output Decision

```
                    Upload input.xlsx
                          │
                          ▼
                  ┌─── Validasi Format ───┐
                  │                       │
               GAGAL                   BERHASIL
                  │                       │
                  ▼                       ▼
          Error message            Parse & Convert
          (STOP, no file)                 │
                                          ▼
                                ┌── Ada anomali? ──┐
                                │                  │
                              YA                TIDAK
                                │                  │
                                ▼                  ▼
                     ┌──────────────────┐  ┌──────────────────┐
                     │ Output ANOMALY:  │  │ Output NORMAL:   │
                     │ Tab Data (input  │  │ 6 kolom standar  │
                     │   + cell merah)  │  │ Other Input      │
                     │ Tab Error        │  │ Entries           │
                     │   (detail list)  │  │                  │
                     └──────────────────┘  └──────────────────┘
```

---

## 2. Nice to Have (Enhancement)

### 2.1. Preview & Inspection

| ID | Fitur | Deskripsi |
|---|---|---|
| N-01 | Input Preview Table | Setelah upload, tampilkan preview 5-10 baris pertama file input dalam tabel HTML. User bisa verifikasi file yang benar sebelum konversi. |
| N-02 | Output Preview Table | Setelah konversi, tampilkan preview output dalam tabel HTML sebelum download. Bisa difilter per karyawan. |
| N-03 | Rules Preview | Tampilkan rules mapping yang terbaca dari file rules.xlsx dalam bentuk tabel. User bisa verifikasi mapping sebelum proses. |
| N-04 | Side-by-Side Comparison | Tampilkan input (horizontal) vs output (vertikal) berdampingan per karyawan. Memudahkan verifikasi manual. |

### 2.2. Data Management

| ID | Fitur | Deskripsi |
|---|---|---|
| N-05 | Admin Panel Rules & Helper | Panel admin untuk upload/update file rules dan data helper yang di-bundle di sistem, tanpa perlu redeploy. |
| N-06 | Conversion History | Simpan riwayat konversi (timestamp, file input, jumlah karyawan, jumlah baris output). Bisa re-download output sebelumnya. |
| N-07 | Multi-Period Batch | Upload beberapa file input sekaligus (per periode) dan hasilkan output per periode atau gabungan. |

### 2.3. Validation & Quality

| ID | Fitur | Deskripsi |
|---|---|---|
| N-08 | Cross-Validation Report | Bandingkan output yang dihasilkan dengan file output contoh (jika di-upload). Tampilkan diff: baris yang cocok, baris yang berbeda, baris yang hilang. |
| N-09 | Amount Range Check | Warning jika ada amount yang terlihat anomali (misal: BPJS > 1.000.000, BASIC = 0 tapi karyawan aktif). Threshold bisa dikonfigurasi. |
| N-10 | Header Auto-Match | Jika header input tidak persis sama dengan rules (typo, spasi ekstra, beda case), tampilkan suggestion match terdekat dan minta konfirmasi user. |

### 2.4. Export Options

| ID | Fitur | Deskripsi |
|---|---|---|
| N-12 | Export to CSV | Selain `.xlsx`, opsi download sebagai `.csv`. |
| N-13 | Export Summary PDF | Ringkasan konversi (jumlah karyawan, total per komponen, dll.) dalam format PDF untuk arsip/audit. |
| N-14 | Custom Output Filename | User bisa tentukan nama file output sendiri sebelum download. |

### 2.5. Configuration & Flexibility

| ID | Fitur | Deskripsi |
|---|---|---|
| N-15 | Sheet Name Selector | Jika file input memiliki banyak sheet, user bisa memilih sheet mana yang akan diproses (default: `PAYROLL`). |
| N-16 | Header Row Selector | User bisa tentukan baris mana yang merupakan header (default: Row 1). Berguna jika format input berubah. |
| N-17 | Custom Skip Logic | Selain NIK dash + nama kosong, user bisa tambah kolom/kondisi lain untuk skip row. Misal: "skip jika GRADE = RESIGN". |
| N-18 | Editable Rules via UI | Edit mapping rules langsung di browser (tambah/hapus/ubah mapping) tanpa harus edit file rules.xlsx di server. Perubahan langsung aktif untuk konversi berikutnya. |
| N-19 | Editable Master Data via UI | Tambah/edit kode Other Input di browser. Otomatis tersimpan untuk konversi berikutnya. |

### 2.6. Security & Access

| ID | Fitur | Deskripsi |
|---|---|---|
| N-20 | File-Only Processing | File di-proses di memory dan tidak disimpan permanen di server. Setelah download selesai, file dihapus otomatis (atau opsi: proses 100% di client-side via WebAssembly / JS library). |
| N-21 | Login & Role Access | Jika multi-user: login sederhana (email + password). Role: Admin (kelola rules & master data), Operator (upload & convert saja). |

### 2.7. Monitoring & Logging

| ID | Fitur | Deskripsi |
|---|---|---|
| N-22 | Audit Log | Log setiap konversi: siapa, kapan, file apa, berapa baris. Untuk keperluan audit payroll. |
| N-23 | Error Log Export | Jika terjadi error/warning saat konversi, user bisa download log detail dalam `.txt` atau `.csv`. |

---

## 3. Priority Matrix

```
                        Low Effort ◄──────────────► High Effort
                   ┌────────────────────────────────────────────┐
  High Impact      │  M-01..M-14  │  M-23..M-26    │            │
                   │  (Core +     │  (Anomaly      │            │
                   │   Upload)    │   Detection)   │            │
                   │  M-15..M-22  │                │            │
                   ├──────────────┼────────────────┼────────────┤
  Medium Impact    │  N-01..N-03  │  N-07, N-10    │  N-18,N-19 │
                   │  (Preview)   │  (Batch,       │  (UI Edit) │
                   │  N-12, N-14  │   Auto-Match)  │            │
                   ├──────────────┼────────────────┼────────────┤
  Low Impact       │  N-13, N-15  │  N-20, N-22    │  N-21      │
                   │  N-16        │  N-23          │  (Login)   │
                   └────────────────────────────────────────────┘
```

---

## 4. Rekomendasi Tahapan Delivery

### Phase 1 — MVP (Must Have)
Semua fitur M-01 s/d M-26. Fokus:
- Upload 1 file input → lihat progress → download output
- Rules & data helper embedded di sistem
- Semua business rules terimplementasi dan tervalidasi
- Anomaly detection → error output dengan cell marking

### Phase 2 — Usability
- N-01 s/d N-04 (Preview & Inspection)
- N-05 (Admin Panel Rules)
- N-12, N-14 (Export CSV, Custom Filename)

### Phase 3 — Advanced
- N-07 (Multi-Period Batch)
- N-08 (Cross-Validation)
- N-09, N-10, N-11 (Detection & Auto-Match)
- N-18, N-19 (Editable via UI)

### Phase 4 — Enterprise
- N-20 s/d N-23 (Security, Login, Audit Log)
- N-13 (PDF Summary)

---

## 5. Constraint & Non-Functional Requirements

| Aspek | Requirement |
|---|---|
| **File Size** | Support file input hingga 10.000 baris karyawan (≈ 5MB `.xlsx`) |
| **Performance** | Konversi selesai dalam < 5 detik untuk 1.000 karyawan |
| **Browser** | Chrome, Edge, Firefox (versi terbaru) |
| **Data Privacy** | File payroll berisi data sensitif (gaji, NIK KTP). Tidak boleh di-log atau disimpan permanen tanpa consent. Proses di HTTPS. |
| **Reliability** | Jika konversi gagal di tengah jalan, tidak boleh menghasilkan file output partial — all or nothing |
| **Idempotent** | Upload file input yang sama harus menghasilkan output yang identik setiap kali |
