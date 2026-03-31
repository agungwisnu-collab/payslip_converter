import * as XLSX from 'xlsx';

export interface ParsedInput {
  headers: string[];
  rows: unknown[][];
}

export function parseInputFile(buffer: ArrayBuffer): ParsedInput {
  const workbook = XLSX.read(buffer, { type: 'array' });

  if (!workbook.SheetNames.includes('PAYROLL')) {
    const available = workbook.SheetNames.join(', ');
    throw new ValidationError(
      `Sheet 'PAYROLL' tidak ditemukan. Sheet yang tersedia: ${available}. Pastikan file input memiliki sheet bernama 'PAYROLL'.`
    );
  }

  const sheet = workbook.Sheets['PAYROLL'];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  if (raw.length < 1) {
    throw new ValidationError('File kosong — tidak ada data yang bisa diproses.');
  }

  const headers = (raw[0] as unknown[]).map(h => (h != null ? String(h).trim() : ''));
  const rows = raw.slice(1);

  return { headers, rows };
}

export function buildColumnMap(headers: string[]): Map<string, number> {
  const map = new Map<string, number>();
  headers.forEach((header, index) => {
    if (header !== '') {
      const normalized = header.toUpperCase();
      map.set(normalized, index);
    }
  });
  return map;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateHeaders(
  headers: string[],
  columnMap: Map<string, number>
): string[] {
  const errors: string[] = [];

  const nikIdx = columnMap.get('NIK');
  const namaIdx = columnMap.get('NAMA');

  if (nikIdx == null || namaIdx == null) {
    const actualB = headers[1] ?? '(kosong)';
    const actualC = headers[2] ?? '(kosong)';
    errors.push(
      `Header kolom tidak sesuai. Kolom B harus 'NIK' dan kolom C harus 'NAMA'. Ditemukan: B='${actualB}', C='${actualC}'`
    );
  }

  const periodeIdx = columnMap.get('PERIODE');
  if (periodeIdx == null) {
    errors.push(
      "Kolom 'PERIODE' tidak ditemukan di header. Pastikan kolom AB berisi header 'PERIODE'."
    );
  }

  return errors;
}
