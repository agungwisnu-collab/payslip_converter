import type { Anomaly } from '../types';

interface AnomalyTableProps {
  anomalies: Anomaly[];
}

export default function AnomalyTable({ anomalies }: AnomalyTableProps) {
  if (anomalies.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-amber-50 text-left">
            <th className="px-3 py-2 border border-amber-200 font-medium text-amber-800">Row</th>
            <th className="px-3 py-2 border border-amber-200 font-medium text-amber-800">NIK</th>
            <th className="px-3 py-2 border border-amber-200 font-medium text-amber-800">Tipe</th>
            <th className="px-3 py-2 border border-amber-200 font-medium text-amber-800">Deskripsi</th>
          </tr>
        </thead>
        <tbody>
          {anomalies.map((a, i) => (
            <tr key={i} className="hover:bg-amber-50/50">
              <td className="px-3 py-2 border border-slate-200 text-slate-600">{a.row || '-'}</td>
              <td className="px-3 py-2 border border-slate-200 text-slate-600 font-mono text-xs">{a.nik || '-'}</td>
              <td className="px-3 py-2 border border-slate-200">
                <span className="inline-block bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded">
                  {a.errorType}
                </span>
              </td>
              <td className="px-3 py-2 border border-slate-200 text-slate-600">{a.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
