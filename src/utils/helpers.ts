export function isNumeric(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function shouldOutputValue(value: unknown): boolean {
  return isNumeric(value) && value !== 0;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function excelSerialToDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const utcMs = utcDays * 86400 * 1000;
  return new Date(utcMs);
}

export function derivePeriode(periodeValue: unknown): { year: number; month: string } {
  let date: Date;

  if (periodeValue instanceof Date) {
    date = periodeValue;
  } else if (typeof periodeValue === 'number') {
    date = excelSerialToDate(periodeValue);
  } else if (typeof periodeValue === 'string') {
    date = new Date(periodeValue);
    if (isNaN(date.getTime())) {
      throw new Error(`Kolom PERIODE berisi string yang tidak bisa diparse: "${periodeValue}"`);
    }
  } else {
    throw new Error(`Kolom PERIODE berisi tipe tidak terduga: ${typeof periodeValue}`);
  }

  return {
    year: date.getFullYear(),
    month: MONTH_NAMES[date.getMonth()],
  };
}

export function preserveEmployeeId(rawValue: unknown): string {
  if (rawValue == null) return '';
  if (typeof rawValue === 'string') return rawValue;
  if (typeof rawValue === 'number') return String(rawValue);
  return String(rawValue);
}

export function formatTimestamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}_${h}${min}${s}`;
}

export function columnIndexToLetter(index: number): string {
  let result = '';
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

export function columnLetterToIndex(letter: string): number {
  let result = 0;
  for (let i = 0; i < letter.length; i++) {
    result = result * 26 + (letter.charCodeAt(i) - 64);
  }
  return result;
}
