import ExcelJS from 'exceljs';
import type { OutputRow, Anomaly } from '../types';
import { formatTimestamp, columnLetterToIndex } from '../utils/helpers';

export async function generateSuccessOutput(
  outputRows: OutputRow[],
  periode: { year: number; month: string }
): Promise<{ blob: Blob; fileName: string }> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');

  // Header
  const headerRow = sheet.addRow([
    'Employee', 'Employee ID', 'Other Input Code',
    'Payslip Period', 'Month', 'Amount',
  ]);
  headerRow.font = { bold: true };

  // Data rows
  for (const row of outputRows) {
    const dataRow = sheet.addRow([
      row.employee,
      row.employeeId,
      row.otherInputCode,
      row.payslipPeriod,
      row.month,
      row.amount,
    ]);
    // Force Employee ID as text
    dataRow.getCell(2).numFmt = '@';
  }

  sheet.columns.forEach(col => { col.width = 20; });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const timestamp = formatTimestamp(new Date());
  const fileName = `Payslip_Hashmicro_${periode.month}${periode.year}_${timestamp}.xlsx`;

  return { blob, fileName };
}

export async function generateAnomalyOutput(
  inputHeaders: string[],
  inputData: unknown[][],
  anomalies: Anomaly[]
): Promise<{ blob: Blob; fileName: string }> {
  const workbook = new ExcelJS.Workbook();

  // Tab 1: Data (copy of input)
  const dataSheet = workbook.addWorksheet('Data');

  const headerRow = dataSheet.addRow(inputHeaders);
  headerRow.font = { bold: true };

  for (const rowData of inputData) {
    const vals = Array.isArray(rowData) ? rowData : [];
    dataSheet.addRow(vals.map(v => (v != null ? v : null)));
  }

  // Mark anomaly cells
  for (const anomaly of anomalies) {
    if (anomaly.row <= 0 || anomaly.column === '') continue;
    const colIdx = columnLetterToIndex(anomaly.column);
    if (colIdx <= 0) continue;

    const cell = dataSheet.getCell(anomaly.row, colIdx);

    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC7CE' },
    };

    cell.note = { texts: [{ text: `[${anomaly.errorType}] ${anomaly.description}` }] } as unknown as ExcelJS.Comment;
  }

  // Tab 2: Error
  const errorSheet = workbook.addWorksheet('Error');

  const errorHeaderRow = errorSheet.addRow([
    'Row', 'Column', 'Employee Name', 'NIK',
    'Field', 'Value', 'Error Type', 'Description',
  ]);
  errorHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  errorHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFCC0000' },
  };

  for (const a of anomalies) {
    errorSheet.addRow([
      a.row, a.column, a.employeeName, a.nik,
      a.field, String(a.value), a.errorType, a.description,
    ]);
  }

  errorSheet.columns.forEach(col => { col.width = 22; });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const timestamp = formatTimestamp(new Date());
  const fileName = `Conversion_Error_${timestamp}.xlsx`;

  return { blob, fileName };
}
