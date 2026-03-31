import type { ConversionSummary } from '../types';

interface ConversionSummaryDisplayProps {
  summary: ConversionSummary;
}

export default function ConversionSummaryDisplay({ summary }: ConversionSummaryDisplayProps) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-slate-500">Periode</span>
        <span className="font-medium text-slate-700">{summary.periode}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">Karyawan diproses</span>
        <span className="font-medium text-slate-700">{summary.totalEmployees}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">Baris output</span>
        <span className="font-medium text-slate-700">{summary.totalOutputRows}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">Baris di-skip</span>
        <span className="font-medium text-slate-700">{summary.skippedRows}</span>
      </div>
      {summary.skippedReasons.length > 0 && (
        <div className="pl-4 space-y-1">
          {summary.skippedReasons.map((s, i) => (
            <p key={i} className="text-xs text-slate-400">
              └ Row {s.row}: {s.reason}
            </p>
          ))}
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-slate-500">Anomali ditemukan</span>
        <span className={`font-medium ${summary.anomalyCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
          {summary.anomalyCount}
        </span>
      </div>
    </div>
  );
}
