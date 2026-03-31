import { Download, AlertTriangle } from 'lucide-react';
import { saveAs } from 'file-saver';

interface DownloadButtonProps {
  blob: Blob;
  fileName: string;
  variant: 'success' | 'anomaly';
}

export default function DownloadButton({ blob, fileName, variant }: DownloadButtonProps) {
  const handleDownload = () => {
    saveAs(blob, fileName);
  };

  if (variant === 'success') {
    return (
      <button
        onClick={handleDownload}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Download size={20} />
        Download Output
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
    >
      <AlertTriangle size={20} />
      Download Error Report
    </button>
  );
}
