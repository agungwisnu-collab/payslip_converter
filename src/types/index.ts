/** Baris output yang dihasilkan converter */
export interface OutputRow {
  employee: string;
  employeeId: string;
  otherInputCode: string;
  payslipPeriod: number;
  month: string;
  amount: number;
}

/** Anomali yang terdeteksi */
export interface Anomaly {
  row: number;
  column: string;
  employeeName: string;
  nik: string;
  field: string;
  value: unknown;
  errorType: AnomalyType;
  description: string;
}

export type AnomalyType =
  | 'ANO-01'
  | 'ANO-02'
  | 'ANO-03'
  | 'ANO-04'
  | 'ANO-05'
  | 'ANO-06'
  | 'ANO-07'
  | 'ANO-08';

export interface ConversionSummary {
  totalEmployees: number;
  totalOutputRows: number;
  skippedRows: number;
  skippedReasons: { row: number; reason: string }[];
  anomalyCount: number;
  periode: string;
}

export interface ConversionResult {
  success: boolean;
  outputRows: OutputRow[];
  anomalies: Anomaly[];
  summary: ConversionSummary;
  rawHeaders: string[];
  rawData: unknown[][];
}

export type AppState =
  | { status: 'idle' }
  | { status: 'processing'; step: number; message: string }
  | { status: 'success'; summary: ConversionSummary; outputBlob: Blob; fileName: string }
  | { status: 'anomaly'; summary: ConversionSummary; anomalies: Anomaly[]; outputBlob: Blob; fileName: string }
  | { status: 'validation-error'; errors: string[] };
