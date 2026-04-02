import type { Anomaly, OutputRow, ConversionResult, ConversionSummary } from '../types';
import { RULES } from '../data/rules';
import { VALID_CODES } from '../data/masterCodes';
import {
  isNumeric,
  shouldOutputValue,
  derivePeriode,
  preserveEmployeeId,
  columnIndexToLetter,
} from '../utils/helpers';
import { buildColumnMap, type ParsedInput } from './parser';

const NEGATIVE_ALLOWED_CODES = new Set(['LOAN_DED', 'ABS_PROF', 'ADJ']);

interface ResolvedRule {
  inputHeader: string;
  outputCode: string;
  columnIndex: number;
  priority?: 'high' | 'default';
}

function resolveBasic(
  gpNewValue: unknown,
  totalGajiPropValue: unknown
): { value: number; source: string; conflict: boolean } | null {
  const afValid = isNumeric(totalGajiPropValue) && totalGajiPropValue > 0;
  const acValid = isNumeric(gpNewValue) && gpNewValue !== 0;

  if (afValid && acValid) {
    return { value: totalGajiPropValue, source: 'TOTAL GAJI PROPORSIONAL', conflict: true };
  }
  if (afValid) {
    return { value: totalGajiPropValue, source: 'TOTAL GAJI PROPORSIONAL', conflict: false };
  }
  if (acValid) {
    return { value: gpNewValue, source: 'GP NEW', conflict: false };
  }
  return null;
}

function resolveBptk(
  ppuValue: unknown,
  bpuValue: unknown
): { value: number; source: string; conflict: boolean } | null {
  const ppuValid = isNumeric(ppuValue) && ppuValue !== 0;
  const bpuValid = isNumeric(bpuValue) && bpuValue !== 0;

  if (ppuValid && bpuValid) {
    return { value: ppuValue, source: 'BPJS TK PPU (conflict: BPU juga terisi)', conflict: true };
  }
  if (ppuValid) {
    return { value: ppuValue, source: 'BPJS TK PPU', conflict: false };
  }
  if (bpuValid) {
    return { value: bpuValue, source: 'BPJS TK BPU', conflict: false };
  }
  return null;
}

function shouldSkipRow(nik: unknown, nikKtp: unknown): boolean {
  const nikEmpty = nik == null || String(nik).trim() === '';
  const nikKtpEmpty = nikKtp == null || String(nikKtp).trim() === '';
  return nikEmpty && nikKtpEmpty;
}

export function convert(input: ParsedInput): ConversionResult {
  const { headers, rows } = input;
  const columnMap = buildColumnMap(headers);

  const outputRows: OutputRow[] = [];
  const anomalies: Anomaly[] = [];
  const skippedReasons: { row: number; reason: string }[] = [];
  let totalEmployees = 0;

  // Resolve column positions for all rules
  const nikIdx = columnMap.get('NIK');
  const nikKtpIdx = columnMap.get('NIK KTP');
  const namaIdx = columnMap.get('NAMA');
  const periodeIdx = columnMap.get('PERIODE');

  // Resolve BASIC columns
  const gpNewIdx = columnMap.get('GP NEW');
  const totalGajiPropIdx = columnMap.get('TOTAL GAJI PROPORSIONAL');

  // Resolve BPTK columns
  const bpjsTkPpuIdx = columnMap.get('BPJS TK PPU');
  const bpjsTkBpuIdx = columnMap.get('BPJS TK BPU ( KHUSUS CS KEMITRAAN)');
  // Also try alternate header names
  const bpjsTkBpuIdxAlt = bpjsTkBpuIdx ?? columnMap.get('BPJS TK BPU (KHUSUS CS KEMITRAAN)');

  // Resolve non-BASIC, non-BPTK rules
  const resolvedRules: ResolvedRule[] = [];
  const processedOutputCodes = new Set<string>();

  for (const rule of RULES) {
    if (rule.outputCode === 'BASIC' || rule.outputCode === 'BPTK') continue;

    const normalizedHeader = rule.inputHeader.trim().toUpperCase();
    const colIdx = columnMap.get(normalizedHeader);

    if (colIdx == null) {
      anomalies.push({
        row: 0,
        column: '',
        employeeName: '',
        nik: '',
        field: rule.inputHeader,
        value: null,
        errorType: 'ANO-07',
        description: `Header "${rule.inputHeader}" dari rules tidak ditemukan di file input. Kolom ini di-skip.`,
      });
      continue;
    }

    if (!VALID_CODES.has(rule.outputCode)) {
      anomalies.push({
        row: 0,
        column: columnIndexToLetter(colIdx),
        employeeName: '',
        nik: '',
        field: rule.inputHeader,
        value: rule.outputCode,
        errorType: 'ANO-04',
        description: `Other Input Code "${rule.outputCode}" dari rules tidak ditemukan di master data.`,
      });
    }

    if (!processedOutputCodes.has(rule.outputCode)) {
      resolvedRules.push({
        inputHeader: rule.inputHeader,
        outputCode: rule.outputCode,
        columnIndex: colIdx,
      });
      processedOutputCodes.add(rule.outputCode);
    }
  }

  // Check ANO-07 for BASIC columns
  if (gpNewIdx == null && totalGajiPropIdx == null) {
    anomalies.push({
      row: 0, column: '', employeeName: '', nik: '',
      field: 'GP NEW / TOTAL GAJI PROPORSIONAL',
      value: null, errorType: 'ANO-07',
      description: 'Tidak ditemukan kolom "GP NEW" maupun "TOTAL GAJI PROPORSIONAL" di file input.',
    });
  }

  // Track NIKs for duplicate detection
  const nikOccurrences = new Map<string, number[]>();

  // Derive periode from first valid row (will be overridden per row if needed)
  let globalPeriode = { year: 0, month: '' };

  // Process each row
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx] as unknown[];
    const excelRow = rowIdx + 2; // 1-based, +1 for header

    const nikRaw = nikIdx != null ? row[nikIdx] : null;
    const nikKtpRaw = nikKtpIdx != null ? row[nikKtpIdx] : null;
    const namaRaw = namaIdx != null ? row[namaIdx] : null;

    // Skip row jika NIK dan NIK KTP keduanya kosong
    if (shouldSkipRow(nikRaw, nikKtpRaw)) {
      if (nikRaw != null || nikKtpRaw != null) {
        skippedReasons.push({
          row: excelRow,
          reason: `NIK dan NIK KTP kosong (NIK="${nikRaw}", NIK KTP="${nikKtpRaw}")`,
        });
      }
      continue;
    }

    totalEmployees++;

    const nik = preserveEmployeeId(nikRaw);
    const nama = namaRaw != null ? String(namaRaw).trim() : '';

    // Track NIK occurrences
    if (!nikOccurrences.has(nik)) {
      nikOccurrences.set(nik, []);
    }
    nikOccurrences.get(nik)!.push(excelRow);

    // ANO-01: NIK without dash but name filled
    const nikHasDash = typeof nikRaw === 'string' && nikRaw.includes('-');
    if (!nikHasDash && nama !== '') {
      anomalies.push({
        row: excelRow,
        column: columnIndexToLetter(nikIdx ?? 1),
        employeeName: nama,
        nik,
        field: 'NIK',
        value: nikRaw,
        errorType: 'ANO-01',
        description: `NIK "${nik}" tidak mengandung karakter dash (-). Baris tetap diproses.`,
      });
    }

    // ANO-02: Name empty but NIK has dash
    if (nikHasDash && nama === '') {
      anomalies.push({
        row: excelRow,
        column: columnIndexToLetter(namaIdx ?? 2),
        employeeName: nama,
        nik,
        field: 'NAMA',
        value: namaRaw,
        errorType: 'ANO-02',
        description: `Nama karyawan kosong untuk NIK "${nik}". Baris tetap diproses.`,
      });
    }

    // Derive periode
    const periodeRaw = periodeIdx != null ? row[periodeIdx] : null;
    let periode = globalPeriode;
    if (periodeRaw != null) {
      try {
        periode = derivePeriode(periodeRaw);
        if (globalPeriode.year === 0) {
          globalPeriode = periode;
        }
      } catch {
        anomalies.push({
          row: excelRow,
          column: columnIndexToLetter(periodeIdx ?? 27),
          employeeName: nama,
          nik,
          field: 'PERIODE',
          value: periodeRaw,
          errorType: 'ANO-03',
          description: `Kolom PERIODE berisi nilai yang tidak bisa diparse sebagai tanggal: "${periodeRaw}".`,
        });
      }
    }

    // Process BASIC (Rule 1: priority)
    const gpNewVal = gpNewIdx != null ? row[gpNewIdx] : null;
    const totalGajiPropVal = totalGajiPropIdx != null ? row[totalGajiPropIdx] : null;

    // ANO-03: Non-numeric value in BASIC columns
    if (gpNewIdx != null && gpNewVal != null && gpNewVal !== '' && !isNumeric(gpNewVal)) {
      anomalies.push({
        row: excelRow,
        column: columnIndexToLetter(gpNewIdx),
        employeeName: nama,
        nik,
        field: 'GP NEW',
        value: gpNewVal,
        errorType: 'ANO-03',
        description: `Cell berisi "${gpNewVal}" (${typeof gpNewVal}) yang bukan numerik. Kolom: GP NEW. Cell di-skip.`,
      });
    }
    if (totalGajiPropIdx != null && totalGajiPropVal != null && totalGajiPropVal !== '' && !isNumeric(totalGajiPropVal)) {
      anomalies.push({
        row: excelRow,
        column: columnIndexToLetter(totalGajiPropIdx),
        employeeName: nama,
        nik,
        field: 'TOTAL GAJI PROPORSIONAL',
        value: totalGajiPropVal,
        errorType: 'ANO-03',
        description: `Cell berisi "${totalGajiPropVal}" (${typeof totalGajiPropVal}) yang bukan numerik. Kolom: TOTAL GAJI PROPORSIONAL. Cell di-skip.`,
      });
    }

    const basicResult = resolveBasic(gpNewVal, totalGajiPropVal);

    if (!basicResult) {
      // Cek apakah kedua kolom kosong (bukan karena non-numeric, yg sudah di-handle ANO-03)
      const gpNewEmpty = gpNewVal == null || gpNewVal === '' || (isNumeric(gpNewVal) && gpNewVal === 0);
      const totalGajiPropEmpty = totalGajiPropVal == null || totalGajiPropVal === '' || (isNumeric(totalGajiPropVal) && totalGajiPropVal <= 0);
      const gpNewNonNumeric = gpNewVal != null && gpNewVal !== '' && !isNumeric(gpNewVal);
      const totalGajiPropNonNumeric = totalGajiPropVal != null && totalGajiPropVal !== '' && !isNumeric(totalGajiPropVal);

      if ((gpNewEmpty || gpNewNonNumeric) && (totalGajiPropEmpty || totalGajiPropNonNumeric)) {
        anomalies.push({
          row: excelRow,
          column: columnIndexToLetter(gpNewIdx ?? 28),
          employeeName: nama,
          nik,
          field: 'GP NEW / TOTAL GAJI PROPORSIONAL',
          value: `GP NEW=${gpNewVal ?? ''}, TOTAL GAJI PROP=${totalGajiPropVal ?? ''}`,
          errorType: 'ANO-07',
          description: `Kedua kolom GP NEW dan TOTAL GAJI PROPORSIONAL kosong atau tidak valid. BASIC tidak dapat dihasilkan.`,
        });
      }
    }

    if (basicResult) {
      // ANO-05: Both BASIC columns filled
      if (basicResult.conflict) {
        anomalies.push({
          row: excelRow,
          column: columnIndexToLetter(gpNewIdx ?? 28),
          employeeName: nama,
          nik,
          field: 'GP NEW / TOTAL GAJI PROPORSIONAL',
          value: `GP NEW=${gpNewVal}, TOTAL GAJI PROP=${totalGajiPropVal}`,
          errorType: 'ANO-05',
          description: `Kedua kolom GP NEW (${gpNewVal}) dan TOTAL GAJI PROPORSIONAL (${totalGajiPropVal}) terisi. Seharusnya hanya satu.`,
        });
      }

      // Column letter sesuai source yang dipakai
      const basicColLetter = basicResult.source === 'TOTAL GAJI PROPORSIONAL'
        ? columnIndexToLetter(totalGajiPropIdx!)
        : columnIndexToLetter(gpNewIdx!);

      checkAndPushRow(
        outputRows, anomalies, excelRow, nama, nik, 'BASIC',
        basicResult.value, periode,
        basicColLetter,
        basicResult.source
      );
    }

    // Process non-BASIC, non-BPTK rules
    for (const rule of resolvedRules) {
      const cellValue = row[rule.columnIndex];

      // ANO-03: Non-numeric value in mapped cell
      if (cellValue != null && cellValue !== '' && !isNumeric(cellValue)) {
        anomalies.push({
          row: excelRow,
          column: columnIndexToLetter(rule.columnIndex),
          employeeName: nama,
          nik,
          field: rule.inputHeader,
          value: cellValue,
          errorType: 'ANO-03',
          description: `Cell berisi "${cellValue}" (${typeof cellValue}) yang bukan numerik. Kolom: ${rule.inputHeader}. Cell di-skip.`,
        });
        continue;
      }

      if (!shouldOutputValue(cellValue)) continue;

      checkAndPushRow(
        outputRows, anomalies, excelRow, nama, nik, rule.outputCode,
        cellValue as number, periode,
        columnIndexToLetter(rule.columnIndex),
        rule.inputHeader
      );
    }

    // Process BPTK (Rule 2: exclusive)
    const ppuVal = bpjsTkPpuIdx != null ? row[bpjsTkPpuIdx] : null;
    const bpuVal = (bpjsTkBpuIdxAlt ?? bpjsTkBpuIdx) != null
      ? row[(bpjsTkBpuIdxAlt ?? bpjsTkBpuIdx)!]
      : null;

    const bptkResult = resolveBptk(ppuVal, bpuVal);

    if (bptkResult) {
      if (bptkResult.conflict) {
        anomalies.push({
          row: excelRow,
          column: columnIndexToLetter(bpjsTkPpuIdx ?? 49),
          employeeName: nama,
          nik,
          field: 'BPJS TK PPU / BPU',
          value: `PPU=${ppuVal}, BPU=${bpuVal}`,
          errorType: 'ANO-05',
          description: `Kedua kolom BPJS TK PPU (${ppuVal}) dan BPJS TK BPU (${bpuVal}) terisi > 0. Seharusnya hanya satu. Menggunakan PPU.`,
        });
      }

      checkAndPushRow(
        outputRows, anomalies, excelRow, nama, nik, 'BPTK',
        bptkResult.value, periode,
        bpjsTkPpuIdx != null ? columnIndexToLetter(bpjsTkPpuIdx) : 'AX',
        bptkResult.source
      );
    }
  }

  // ANO-08: Duplicate NIK detection (post-loop)
  for (const [dupNik, rowNums] of nikOccurrences) {
    if (rowNums.length > 1) {
      for (let i = 1; i < rowNums.length; i++) {
        anomalies.push({
          row: rowNums[i],
          column: columnIndexToLetter(nikIdx ?? 1),
          employeeName: '',
          nik: dupNik,
          field: 'NIK',
          value: dupNik,
          errorType: 'ANO-08',
          description: `NIK "${dupNik}" ditemukan duplikat (muncul ${rowNums.length}x di file input). Baris ke-${i + 1}.`,
        });
      }
    }
  }

  const summary: ConversionSummary = {
    totalEmployees,
    totalOutputRows: outputRows.length,
    skippedRows: skippedReasons.length,
    skippedReasons,
    anomalyCount: anomalies.length,
    periode: globalPeriode.year > 0 ? `${globalPeriode.month} ${globalPeriode.year}` : 'Unknown',
  };

  return {
    success: anomalies.length === 0,
    outputRows,
    anomalies,
    summary,
    rawHeaders: headers,
    rawData: rows,
  };
}

function checkAndPushRow(
  outputRows: OutputRow[],
  anomalies: Anomaly[],
  excelRow: number,
  nama: string,
  nik: string,
  code: string,
  value: number,
  periode: { year: number; month: string },
  colLetter: string,
  _field: string
): void {
  // ANO-06: Negative amount on non-deduction code
  if (value < 0 && !NEGATIVE_ALLOWED_CODES.has(code)) {
    anomalies.push({
      row: excelRow,
      column: colLetter,
      employeeName: nama,
      nik,
      field: _field,
      value,
      errorType: 'ANO-06',
      description: `Nilai negatif (${value}) pada kolom ${_field}. Komponen ini biasanya bernilai positif.`,
    });
  }

  outputRows.push({
    employee: nama,
    employeeId: nik,
    otherInputCode: code,
    payslipPeriod: periode.year,
    month: periode.month,
    amount: value,
  });
}
