import { Upload } from 'lucide-react';
import { useRef, useState, useCallback } from 'react';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  disabled: boolean;
}

export default function FileUpload({ onFileSelected, disabled }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls') {
        alert('Format file tidak didukung. Hanya menerima file .xlsx atau .xls');
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile]
  );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setDragOver(true);
    },
    [disabled]
  );

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (inputRef.current) inputRef.current.value = '';
    },
    [handleFile]
  );

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer
        ${disabled ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-50' : ''}
        ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={onChange}
        disabled={disabled}
      />
      <Upload className="mx-auto mb-4 text-slate-400" size={48} />
      <p className="text-lg font-medium text-slate-700 mb-1">
        Drag & drop file atau klik untuk pilih
      </p>
      <p className="text-sm text-slate-400">
        Hanya menerima file .xlsx atau .xls
      </p>
    </div>
  );
}
