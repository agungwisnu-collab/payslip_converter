import { XCircle } from 'lucide-react';

interface ErrorDisplayProps {
  errors: string[];
  onReset: () => void;
}

export default function ErrorDisplay({ errors, onReset }: ErrorDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-red-600">
        <XCircle size={24} />
        <h2 className="text-lg font-semibold">File tidak valid</h2>
      </div>
      <ul className="space-y-2">
        {errors.map((err, i) => (
          <li key={i} className="text-sm text-slate-600 bg-red-50 rounded-lg p-3 border border-red-100">
            {err}
          </li>
        ))}
      </ul>
      <button
        onClick={onReset}
        className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        Upload ulang
      </button>
    </div>
  );
}
