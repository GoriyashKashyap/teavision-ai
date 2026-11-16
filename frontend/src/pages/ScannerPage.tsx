import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Upload, Camera, X, Scan, AlertCircle, CheckCircle2, Loader2, ChevronLeft, BookOpen, BarChart2, History as HistoryIcon } from 'lucide-react';
import { predict, extractApiError } from '../services/api';
import type { UploadState } from '../types';
import ResultsCard from '../components/prediction/ResultsCard';
import ModelSelector from '../components/prediction/ModelSelector';
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '../lib/constants';

function validateFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `Unsupported file type: ${file.type || 'unknown'}. Please upload a JPEG, PNG, or WebP image.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is ${MAX_FILE_SIZE_MB} MB.`;
  }
  return null;
}

export default function ScannerPage() {
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  const [selectedModelId, setSelectedModelId] = useState('lightteanet-eca-kd');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setState({ status: 'error', message: error });
      return;
    }
    const preview = URL.createObjectURL(file);
    setState({ status: 'selected', file, preview });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be reselected
    e.target.value = '';
  }, [handleFile]);

  const handleSubmit = useCallback(async () => {
    if (state.status !== 'selected') return;
    const { file, preview } = state;

    setState({ status: 'uploading', progress: 0, preview });

    try {
      const result = await predict(file, (pct) => {
        setState({ status: 'uploading', progress: pct, preview });
      }, selectedModelId);
      setState({ status: 'success', result, preview });
    } catch (err) {
      setState({ status: 'error', message: extractApiError(err) });
    }
  }, [state, selectedModelId]);

  const reset = useCallback(() => {
    if ('preview' in state && state.preview) {
      URL.revokeObjectURL(state.preview);
    }
    setState({ status: 'idle' });
  }, [state]);

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <nav className="border-b border-forest-900/8 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="section-wrapper">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-tv-secondary hover:text-tv-primary transition-colors">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-forest-900 to-forest-700 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-tv-primary">TeaVision AI</span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="text-xs font-medium text-forest-800 hover:text-forest-950 flex items-center gap-1 bg-forest-50 hover:bg-forest-100/80 px-2 py-1.5 rounded-lg border border-forest-900/10 transition-colors"
                title="Analytics Dashboard"
              >
                <BarChart2 className="w-3.5 h-3.5 text-forest-700" />
                <span className="hidden sm:inline">Analytics</span>
              </Link>
              <Link
                to="/history"
                className="text-xs font-medium text-forest-800 hover:text-forest-950 flex items-center gap-1 bg-forest-50 hover:bg-forest-100/80 px-2 py-1.5 rounded-lg border border-forest-900/10 transition-colors"
                title="Prediction History"
              >
                <HistoryIcon className="w-3.5 h-3.5 text-forest-700" />
                <span className="hidden sm:inline">History</span>
              </Link>
              <Link
                to="/diseases"
                className="text-xs font-medium text-forest-800 hover:text-forest-950 flex items-center gap-1 bg-forest-50 hover:bg-forest-100/80 px-2 py-1.5 rounded-lg border border-forest-900/10 transition-colors"
                title="Disease Library"
              >
                <BookOpen className="w-3.5 h-3.5 text-forest-700" />
                <span className="hidden sm:inline">Library</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="section-wrapper py-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-tv-primary mb-2">Scan a Tea Leaf</h1>
          <p className="text-tv-secondary">Upload or capture a tea leaf image to detect diseases using AI.</p>
        </div>

        {/* Success state — show results */}
        {state.status === 'success' && (
          <ResultsCard
            result={state.result}
            previewUrl={state.preview}
            onReset={reset}
          />
        )}

        {/* Upload / selected state */}
        {(state.status === 'idle' || state.status === 'selected' || state.status === 'uploading' || state.status === 'error') && (
          <>
            {/* Drop zone */}
            {state.status === 'idle' && (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="card border-2 border-dashed border-forest-900/20 hover:border-forest-600/40 hover:bg-forest-50/50 transition-all duration-200 p-8 text-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-14 h-14 rounded-full bg-forest-100 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-7 h-7 text-forest-700" />
                </div>
                <h3 className="font-display font-semibold text-tv-primary mb-2">Drop an image here</h3>
                <p className="text-sm text-tv-secondary mb-6">
                  JPEG, PNG or WebP · Max {MAX_FILE_SIZE_MB} MB
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="btn-secondary"
                  >
                    <Upload className="w-4 h-4" />
                    Choose File
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                    className="btn-primary"
                  >
                    <Camera className="w-4 h-4" />
                    Use Camera
                  </button>
                </div>
              </div>
            )}

            {/* Selected preview */}
            {state.status === 'selected' && (
              <div className="card overflow-hidden animate-fade-in">
                <div className="relative bg-black aspect-video">
                  <img
                    src={state.preview}
                    alt="Selected leaf"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={reset}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-tv-primary truncate">{state.file.name}</p>
                    <p className="text-xs text-tv-secondary">{(state.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={handleSubmit} className="btn-primary flex-shrink-0">
                    <Scan className="w-4 h-4" />
                    Analyze Leaf
                  </button>
                </div>
              </div>
            )}

            {/* Model Selection — shown when idle or image selected */}
            {(state.status === 'idle' || state.status === 'selected') && (
              <ModelSelector
                selectedModelId={selectedModelId}
                onSelectModel={setSelectedModelId}
                disabled={false}
                className="mt-4"
              />
            )}

            {/* Uploading */}
            {state.status === 'uploading' && (
              <div className="card p-8 text-center animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-forest-100 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-7 h-7 text-forest-700 animate-spin" />
                </div>
                <h3 className="font-display font-semibold text-tv-primary mb-2">Analyzing your leaf…</h3>
                <p className="text-sm text-tv-secondary mb-4">Running {selectedModelId === 'lightteanet-eca-kd' ? 'LightTeaNet-ECA' : selectedModelId === 'lightteanet-se' ? 'LightTeaNet-SE' : selectedModelId === 'mobilenetv2-baseline' ? 'MobileNetV2' : selectedModelId === 'mobilevit-xxs' ? 'MobileViT-XXS' : 'MobileViT-S'} inference</p>
                <div className="confidence-bar max-w-xs mx-auto">
                  <div
                    className="confidence-fill"
                    style={{ width: `${Math.max(state.progress, 10)}%` }}
                  />
                </div>
                <p className="text-xs text-tv-secondary mt-2 tab-nums">{state.progress}%</p>
              </div>
            )}

            {/* Error */}
            {state.status === 'error' && (
              <div className="card border border-red-200 p-6 animate-fade-in">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-tv-primary mb-1">Analysis failed</h3>
                    <p className="text-sm text-tv-secondary mb-4">{state.message}</p>
                    <button onClick={reset} className="btn-secondary text-sm">
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Guidelines */}
            {state.status === 'idle' && (
              <div className="mt-6 card p-5 space-y-3">
                <h4 className="font-display font-semibold text-sm text-tv-primary">Photo guidelines</h4>
                <ul className="space-y-2">
                  {[
                    'Photograph a single tea leaf clearly in frame',
                    'Ensure good, even lighting — avoid harsh shadows',
                    'Keep the leaf in focus; blurry images reduce accuracy',
                    'Shoot against a neutral background if possible',
                  ].map((tip) => (
                    <li key={tip} className="flex items-start gap-2 text-sm text-tv-secondary">
                      <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="sr-only"
          onChange={handleInputChange}
          aria-label="Upload image file"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={handleInputChange}
          aria-label="Capture image with camera"
        />
      </div>
    </div>
  );
}
