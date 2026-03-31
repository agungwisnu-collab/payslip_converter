import { useState, useCallback } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import type { AppState } from './types';
import FileUpload from './components/FileUpload';
import ProgressIndicator from './components/ProgressIndicator';
import ConversionSummaryDisplay from './components/ConversionSummary';
import ErrorDisplay from './components/ErrorDisplay';
import DownloadButton from './components/DownloadButton';
import AnomalyTable from './components/AnomalyTable';
import TemplateDownload from './components/TemplateDownload';
import { parseInputFile, validateHeaders, buildColumnMap, ValidationError } from './engine/parser';
import { convert } from './engine/converter';
import { generateSuccessOutput, generateAnomalyOutput } from './engine/outputGenerator';

function App() {
  const [state, setState] = useState<AppState>({ status: 'idle' });

  const setProgress = useCallback((step: number, message: string) => {
    setState({ status: 'processing', step, message });
  }, []);

  const handleFileSelected = useCallback(async (file: File) => {
    try {
      // Step 1: Upload
      setProgress(1, 'File diterima');
      await delay(200);

      let buffer: ArrayBuffer;
      try {
        buffer = await file.arrayBuffer();
      } catch {
        setState({ status: 'validation-error', errors: ['File tidak bisa dibaca. File mungkin corrupt atau dilindungi password.'] });
        return;
      }

      // Step 2: Validasi
      setProgress(2, 'Memeriksa sheet dan header...');
      await delay(200);

      let parsed;
      try {
        parsed = parseInputFile(buffer);
      } catch (e) {
        if (e instanceof ValidationError) {
          setState({ status: 'validation-error', errors: [e.message] });
        } else {
          setState({ status: 'validation-error', errors: ['Gagal membaca file Excel.'] });
        }
        return;
      }

      const columnMap = buildColumnMap(parsed.headers);
      const headerErrors = validateHeaders(parsed.headers, columnMap);
      if (headerErrors.length > 0) {
        setState({ status: 'validation-error', errors: headerErrors });
        return;
      }

      // Step 3: Parsing
      setProgress(3, 'Membaca data karyawan...');
      await delay(200);

      // Step 4: Mapping & Conversion
      setProgress(4, 'Mencocokkan kolom payroll → kode output...');
      await delay(100);

      const result = convert(parsed);

      // Step 5: Generate output
      setProgress(5, 'Membuat file hasil...');
      await delay(200);

      if (result.success) {
        const periodeParts = result.summary.periode.split(' ');
        const periode = {
          month: periodeParts[0] || 'Unknown',
          year: parseInt(periodeParts[1]) || new Date().getFullYear(),
        };

        const { blob, fileName } = await generateSuccessOutput(result.outputRows, periode);

        setProgress(6, 'Konversi selesai');
        await delay(300);

        setState({
          status: 'success',
          summary: result.summary,
          outputBlob: blob,
          fileName,
        });
      } else {
        const { blob, fileName } = await generateAnomalyOutput(
          result.rawHeaders,
          result.rawData,
          result.anomalies
        );

        setProgress(6, 'Konversi selesai — ditemukan anomali');
        await delay(300);

        setState({
          status: 'anomaly',
          summary: result.summary,
          anomalies: result.anomalies,
          outputBlob: blob,
          fileName,
        });
      }
    } catch {
      setState({
        status: 'validation-error',
        errors: ['Terjadi kesalahan tidak terduga saat memproses file.'],
      });
    }
  }, [setProgress]);

  const handleReset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Payslip Converter</h1>
          <p className="text-sm text-slate-400 mt-1">Draft Payroll → Hashmicro Payslip</p>
          <div className="mt-2">
            <TemplateDownload />
          </div>
        </div>

        {/* State: Idle */}
        {state.status === 'idle' && (
          <FileUpload onFileSelected={handleFileSelected} disabled={false} />
        )}

        {/* State: Processing */}
        {state.status === 'processing' && (
          <div className="py-4">
            <ProgressIndicator currentStep={state.step} message={state.message} />
          </div>
        )}

        {/* State: Success */}
        {state.status === 'success' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={24} />
              <h2 className="text-lg font-semibold">Konversi berhasil!</h2>
            </div>
            <ConversionSummaryDisplay summary={state.summary} />
            <DownloadButton blob={state.outputBlob} fileName={state.fileName} variant="success" />
            <p className="text-xs text-slate-400 text-center mt-1">{state.fileName}</p>
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 py-2 transition-colors text-sm"
            >
              <RotateCcw size={16} />
              Konversi file lain
            </button>
          </div>
        )}

        {/* State: Anomaly */}
        {state.status === 'anomaly' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle size={24} />
              <h2 className="text-lg font-semibold">Ditemukan anomali pada data input!</h2>
            </div>
            <ConversionSummaryDisplay summary={state.summary} />
            <AnomalyTable anomalies={state.anomalies} />
            <DownloadButton blob={state.outputBlob} fileName={state.fileName} variant="anomaly" />
            <p className="text-xs text-slate-400 text-center mt-1">{state.fileName}</p>
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 py-2 transition-colors text-sm"
            >
              <RotateCcw size={16} />
              Konversi file lain
            </button>
          </div>
        )}

        {/* State: Validation Error */}
        {state.status === 'validation-error' && (
          <ErrorDisplay errors={state.errors} onReset={handleReset} />
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 mt-8 flex items-center justify-center gap-1">
          <ShieldCheck size={14} />
          Semua proses dilakukan di browser Anda. File tidak dikirim ke server manapun.
        </div>
      </div>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default App
