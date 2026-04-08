import { FileSpreadsheet } from 'lucide-react';
import ExcelJS from 'exceljs';

const TEMPLATE_HEADERS = [
  'NO', 'NIK', 'NAMA', 'NIK KTP', 'nik2', 'DIV', 'DEPT', 'SECT', 'JAB/PKT', 'GRADE',
  'JOB TITLE', 'EDUCATION FIELD', 'TANGGAL MASUK', 'YEARS IN SERVICES', 'BANK PENERIMA',
  'NO REKENING', 'NAMA PENERIMA', 'HARI MASUK EFEKTIF BULAN INI', 'HKE AFTER MAGANG',
  'HKE AFTER PROBATION', 'SAKIT (SD)', 'IJIN TIDAK DIBAYAR', 'REP TELAT', 'ALPHA',
  'LEMBUR (JAM)', 'CUTI', 'CUTI BONUS', 'PERIODE', 'GP NEW',
  'GAJI BULAN SEBELUMNYA (Proporsional)', 'GAJI BULAN INI (Proporsional)',
  'TOTAL GAJI PROPORSIONAL', 'T. JABATAN', 'T. KEHADIRAN', 'T. PROFESI', 'T. CASTING',
  'T. PENUGASAN', 'T. BEBAN KERJA', 'U. SEWA KEND', 'KEKURANGAN GAJI',
  'REIMBURSEMENT KESEHATAN', 'LEMBUR', 'GET POIN KPI', 'PENGKALI', 'BONUS SALES (Rp)',
  'KEBIJAKAN CEO', 'CICILAN PINJAMAN', 'POTONGAN ABSEN KEHDRAN & PROFESI',
  'BPJS KESEHATAN', 'BPJS TK PPU', 'BPJS TK BPU ( KHUSUS CS KEMITRAAN)',
  'LAIN LAIN (Potongan PPh 21 Periode Gaji Dec-24)', 'THP NEW NEW', 'ROUNDING',
  'ENTITAS BARU UPDATE',
];

const SAMPLE_ROWS: (string | number | Date)[][] = [
  [
    1, '221115-0007', 'CLOUD STRIFE', '3201010101010001', '221115-0007', 'OPERATION', 'PRODUKSI',
    'ASSEMBLY', 'STAFF', '', 'Production Staff', 'S1 Teknik', new Date(2022, 10, 15),
    '3 Tahun 1 Bulan', 'BCA', '1234567890', 'CLOUD STRIFE', 22, 0, 0, 0, 0, 0, 0, 8, 0, 0,
    new Date(2025, 0, 1), 5500000, 0, 0, 0, 750000, 400000, 0, 0, 0, 0, 0, 0, 0, 200000,
    0, 0, 0, 0, 0, 0, 200000, 280000, 0, 0, 0, 0, '',
  ],
  [
    2, '230901-4321', 'AERITH GAINSBOROUGH', '3201029999990002', '230901-4321', 'MARKETING',
    'SALES', 'REGION A', 'SUPERVISOR', '', 'Sales Supervisor', 'S1 Manajemen',
    new Date(2023, 8, 1), '1 Tahun 4 Bulan', 'MANDIRI', '0987654321',
    'AERITH GAINSBOROUGH', 22, 0, 0, 1, 0, 0, 0, 4, 0, 0, new Date(2025, 0, 1),
    7000000, 3500000, 3500000, 7000000, 1000000, 500000, 500000, 0, 1200000, 0, 0, 0, 0,
    0, 0, 0, 0, 1500000, 0, 0, 250000, 350000, 0, 0, 0, 0, '',
  ],
];

function applyBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' },
  };
}

function applySectionHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5496' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    cell.alignment = { vertical: 'middle' };
  });
  row.height = 28;
}

function buildGuideSheet(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet('PANDUAN');

  // --- Section A: Penjelasan Umum ---
  ws.mergeCells('A1:D1');
  ws.getCell('A1').value = 'PANDUAN PENGISIAN DRAFT PAYROLL';
  applySectionHeader(ws.getRow(1));

  const intro = [
    'File ini adalah template untuk mengisi data payroll karyawan.',
    'Pastikan data diisi pada tab "PAYROLL". Tab "PANDUAN" ini hanya sebagai panduan dan tidak akan diproses oleh sistem.',
    'Setiap baris mewakili 1 karyawan. Isi semua kolom yang relevan, kosongkan kolom yang tidak berlaku.',
    'Setelah diisi, upload file ini ke website converter untuk menghasilkan file payslip.',
  ];
  intro.forEach((text, i) => {
    const r = 3 + i;
    ws.mergeCells(`A${r}:D${r}`);
    ws.getCell(`A${r}`).value = text;
    ws.getCell(`A${r}`).font = { size: 10 };
  });

  // --- Section B: Mapping Kolom ---
  const mapStart = 9;
  ws.mergeCells(`A${mapStart}:D${mapStart}`);
  ws.getCell(`A${mapStart}`).value = 'MAPPING KOLOM INPUT → KODE OUTPUT';
  applySectionHeader(ws.getRow(mapStart));

  const mapHeader = mapStart + 1;
  ws.getRow(mapHeader).values = ['Kolom di Draft Payroll', 'Kode Output', 'Keterangan', 'Contoh Nilai'];
  ws.getRow(mapHeader).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } };
    cell.font = { bold: true, size: 10 };
    applyBorder(cell);
  });

  const mappings = [
    ['GP NEW', 'BASIC', 'Gaji pokok karyawan. Digunakan jika Total Gaji Proporsional kosong atau nol.', '5.500.000'],
    ['TOTAL GAJI PROPORSIONAL', 'BASIC', 'Gaji proporsional (untuk karyawan yang belum genap 1 bulan). Jika terisi, nilai ini yang dipakai sebagai gaji pokok, bukan GP NEW.', '7.000.000'],
    ['T. JABATAN', 'ALW1', 'Tunjangan berdasarkan jabatan karyawan.', '1.000.000'],
    ['T. KEHADIRAN', 'ALW2', 'Tunjangan berdasarkan kehadiran karyawan.', '500.000'],
    ['T. PROFESI', 'ALW3', 'Tunjangan berdasarkan bidang profesi.', '500.000'],
    ['T. CASTING', 'ALW6', 'Tunjangan casting (jika ada).', '0'],
    ['T. PENUGASAN', 'ALW7', 'Tunjangan penugasan khusus.', '1.200.000'],
    ['T. BEBAN KERJA', 'PPH21_TER_ALW', 'Tunjangan beban kerja, termasuk perhitungan PPh 21.', '0'],
    ['U. SEWA KEND', 'SWM', 'Uang sewa kendaraan operasional.', '0'],
    ['KEKURANGAN GAJI', 'ADJ', 'Selisih gaji yang belum dibayarkan di periode sebelumnya.', '0'],
    ['REIMBURSEMENT KESEHATAN', 'AET', 'Penggantian biaya kesehatan karyawan.', '0'],
    ['LEMBUR', 'OVT_ALW', 'Upah lembur berdasarkan jam kerja tambahan.', '200.000'],
    ['BONUS SALES (Rp)', 'BONUS', 'Bonus penjualan berdasarkan pencapaian target.', '0'],
    ['KEBIJAKAN CEO', 'CEO', 'Pembayaran khusus berdasarkan kebijakan direksi.', '1.500.000'],
    ['CICILAN PINJAMAN', 'LOAN_DED', 'Potongan cicilan pinjaman karyawan (nilai akan menjadi pengurang).', '0'],
    ['POTONGAN ABSEN KEHDRAN & PROFESI', 'ABS_PROF', 'Potongan karena ketidakhadiran atau pelanggaran profesi.', '0'],
    ['BPJS KESEHATAN', 'BPJS_KES_EMP', 'Iuran BPJS Kesehatan bagian karyawan.', '250.000'],
    ['BPJS TK PPU', 'BPTK', 'Iuran BPJS Ketenagakerjaan untuk Penerima Upah (karyawan tetap).', '350.000'],
    ['BPJS TK BPU (KHUSUS CS KEMITRAAN)', 'BPTK', 'Iuran BPJS Ketenagakerjaan untuk Bukan Penerima Upah (mitra). Tidak boleh diisi bersamaan dengan BPJS TK PPU.', '0'],
    ['LAIN LAIN (Potongan PPh 21)', 'PPH21_TER', 'Potongan PPh 21 karyawan. Header kolom bisa bervariasi, cukup mengandung kata "LAIN LAIN".', '0'],
  ];

  mappings.forEach((row, i) => {
    const r = ws.getRow(mapHeader + 1 + i);
    r.values = row;
    r.eachCell((cell) => {
      cell.font = { size: 10 };
      cell.alignment = { wrapText: true, vertical: 'top' };
      applyBorder(cell);
    });
  });

  // --- Section C: Aturan Pengisian ---
  const rulesStart = mapHeader + mappings.length + 3;
  ws.mergeCells(`A${rulesStart}:D${rulesStart}`);
  ws.getCell(`A${rulesStart}`).value = 'ATURAN PENGISIAN';
  applySectionHeader(ws.getRow(rulesStart));

  const rulesHeader = rulesStart + 1;
  ws.getRow(rulesHeader).values = ['No', 'Aturan', 'Penjelasan', 'Contoh'];
  ws.getRow(rulesHeader).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } };
    cell.font = { bold: true, size: 10 };
    applyBorder(cell);
  });

  const rules = [
    ['1', 'Format NIK harus mengandung tanda hubung (-)',
      'Nomor Induk Karyawan wajib menggunakan format dengan tanda hubung. Baris tanpa format ini akan ditandai sebagai tidak sesuai.',
      '221115-0007 ✅\n12345678 ❌'],
    ['2', 'NIK dan NIK KTP tidak boleh kosong bersamaan',
      'Jika kolom NIK dan NIK KTP keduanya kosong, baris tersebut akan dilewati dan tidak diproses.',
      'NIK kosong + NIK KTP kosong = dilewati'],
    ['3', 'Kolom PERIODE wajib diisi',
      'Kolom periode menentukan bulan dan tahun payslip. Jika kosong, data akan ditandai bermasalah.',
      'Jan-25, Feb-25, Mar-25'],
    ['4', 'Nilai kosong atau nol tidak akan diproses',
      'Komponen gaji yang bernilai 0, kosong, atau bukan angka tidak akan muncul di file output. Hanya komponen yang benar-benar ada nilainya yang dibuatkan baris output.',
      'T. Jabatan = 0 → tidak muncul\nT. Jabatan = 750.000 → muncul'],
    ['5', 'Gaji Pokok: Total Gaji Proporsional lebih diutamakan',
      'Jika kolom "Total Gaji Proporsional" terisi (lebih dari nol), nilai tersebut yang digunakan sebagai gaji pokok (BASIC). Jika kosong atau nol, sistem akan menggunakan nilai dari kolom "GP NEW".',
      'GP NEW = 5jt, Total Proporsional = 7jt → BASIC = 7jt\nGP NEW = 5jt, Total Proporsional = 0 → BASIC = 5jt'],
    ['6', 'BPJS TK PPU dan BPJS TK BPU tidak boleh terisi bersamaan',
      'Satu karyawan hanya boleh memiliki salah satu: BPJS TK PPU (untuk karyawan tetap) atau BPJS TK BPU (untuk mitra). Jika keduanya terisi, data akan ditandai bermasalah.',
      'BPJS TK PPU = 350rb, BPJS TK BPU = 0 ✅\nBPJS TK PPU = 350rb, BPJS TK BPU = 200rb ❌'],
    ['7', 'Semua nilai harus berupa angka',
      'Kolom-kolom gaji dan tunjangan harus diisi dengan angka. Jika terisi teks atau karakter lain, data akan ditandai bermasalah.',
      '5500000 ✅\nLima Juta ❌\nTBD ❌'],
    ['8', 'Tidak boleh ada karyawan dengan NIK yang sama',
      'Setiap baris harus memiliki NIK yang unik. Jika ditemukan NIK yang sama di lebih dari satu baris, semua baris dengan NIK tersebut akan ditandai.',
      'Baris 2: 221115-0007\nBaris 5: 221115-0007 → duplikat ❌'],
  ];

  rules.forEach((row, i) => {
    const r = ws.getRow(rulesHeader + 1 + i);
    r.values = row;
    r.eachCell((cell) => {
      cell.font = { size: 10 };
      cell.alignment = { wrapText: true, vertical: 'top' };
      applyBorder(cell);
    });
    r.height = 50;
  });

  // --- Section D: Catatan Penting ---
  const notesStart = rulesHeader + rules.length + 3;
  ws.mergeCells(`A${notesStart}:D${notesStart}`);
  ws.getCell(`A${notesStart}`).value = 'CATATAN PENTING';
  applySectionHeader(ws.getRow(notesStart));

  const notes = [
    '• Jangan mengubah nama tab "PAYROLL". Sistem hanya memproses data dari tab tersebut.',
    '• Jangan menambah, menghapus, atau mengubah urutan kolom header di tab "PAYROLL".',
    '• Tab "PANDUAN" ini tidak akan diproses oleh sistem — hanya sebagai referensi.',
    '• Jika terdapat data yang tidak sesuai, sistem akan menghasilkan file berisi data asli beserta tab "Error" yang menjelaskan masalahnya.',
    '• Data yang Anda upload TIDAK dikirim ke server manapun. Semua proses dilakukan di browser Anda.',
  ];

  notes.forEach((text, i) => {
    const r = notesStart + 1 + i;
    ws.mergeCells(`A${r}:D${r}`);
    ws.getCell(`A${r}`).value = text;
    ws.getCell(`A${r}`).font = { size: 10, italic: true };
  });

  // Column widths
  ws.getColumn(1).width = 35;
  ws.getColumn(2).width = 20;
  ws.getColumn(3).width = 55;
  ws.getColumn(4).width = 30;
}

export default function TemplateDownload() {
  const handleDownload = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('PAYROLL');

    // Header row
    ws.addRow(TEMPLATE_HEADERS);
    const headerRow = ws.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      applyBorder(cell);
    });
    headerRow.height = 30;

    // Sample data rows
    for (const row of SAMPLE_ROWS) {
      const dataRow = ws.addRow(row);
      dataRow.eachCell((cell) => applyBorder(cell));
    }

    // Auto-width (capped at 30)
    ws.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = String(cell.value ?? '').length;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(maxLen + 2, 30);
    });

    // Format PERIODE column as date
    [2, 3].forEach((rowNum) => {
      const cell = ws.getCell(rowNum, 28);
      cell.numFmt = 'MMM-YY';
    });

    // Build guide sheet
    buildGuideSheet(wb);

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Template_Draft_Payroll.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
    >
      <FileSpreadsheet size={14} />
      Download template draft payroll
    </button>
  );
}
