import { Check, Loader2 } from 'lucide-react';

const STEPS = [
  { step: 1, label: 'Upload', description: 'File diterima' },
  { step: 2, label: 'Validasi format', description: 'Memeriksa sheet dan header' },
  { step: 3, label: 'Parsing data', description: 'Membaca data karyawan' },
  { step: 4, label: 'Mapping komponen', description: 'Mencocokkan kolom payroll → kode output' },
  { step: 5, label: 'Generating output', description: 'Membuat file hasil' },
  { step: 6, label: 'Selesai', description: 'Konversi selesai' },
];

interface ProgressIndicatorProps {
  currentStep: number;
  message: string;
}

export default function ProgressIndicator({ currentStep, message }: ProgressIndicatorProps) {
  return (
    <div className="space-y-3">
      {STEPS.map(({ step, label }) => {
        const isDone = step < currentStep;
        const isActive = step === currentStep;

        return (
          <div key={step} className="flex items-center gap-3">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                ${isDone ? 'bg-green-500 text-white' : ''}
                ${isActive ? 'bg-blue-500 text-white animate-pulse' : ''}
                ${!isDone && !isActive ? 'bg-slate-200 text-slate-400' : ''}
              `}
            >
              {isDone ? <Check size={16} /> : step}
            </div>
            <span
              className={`text-sm ${isDone ? 'text-slate-400' : isActive ? 'text-slate-700 font-medium' : 'text-slate-300'}`}
            >
              {isActive ? message || label : label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function LoadingSpinner() {
  return <Loader2 className="animate-spin text-blue-500" size={24} />;
}
