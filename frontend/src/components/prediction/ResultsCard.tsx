import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  Cpu,
  CheckCircle2,
  Leaf,
  Download,
  BookOpen,
  Info,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Bot,
} from 'lucide-react';
import type { PredictionResult } from '../../types';
import { LOW_CONFIDENCE_THRESHOLD } from '../../lib/constants';
import { DISEASE_LIBRARY } from '../../data/diseases';
import ProbabilityChart from '../charts/ProbabilityChart';
import FeedbackWidget from './FeedbackWidget';
import FieldObservationForm from './FieldObservationForm';
import AttentionHeatmap from './AttentionHeatmap';
import DiagnosticAssessmentCard from './DiagnosticAssessmentCard';
import ImageQualityBadge from './ImageQualityBadge';
import AIAssistantDrawer from '../assistant/AIAssistantDrawer';

interface Props {
  result: PredictionResult;
  previewUrl?: string;
  onReset: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  algal: 'bg-amber-100 text-amber-800 border-amber-300',
  fungal: 'bg-rose-100 text-rose-800 border-rose-300',
  pest: 'bg-orange-100 text-orange-800 border-orange-300',
  healthy: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

export default function ResultsCard({ result, previewUrl, onReset }: Props) {
  const [showFullGuidance, setShowFullGuidance] = useState(true);
  const [showAssistant, setShowAssistant] = useState(false);

  const isHealthy = result.predicted_class === 'Healthy leaf';
  const isLowConfidence = result.confidence < LOW_CONFIDENCE_THRESHOLD;
  const diseaseInfo = DISEASE_LIBRARY[result.predicted_class];

  const categoryBadgeClass =
    diseaseInfo && CATEGORY_COLORS[diseaseInfo.category]
      ? CATEGORY_COLORS[diseaseInfo.category]
      : 'bg-slate-100 text-slate-800 border-slate-300';

  const downloadReport = () => {
    const lines = [
      '============================================================',
      'TEA VISION AI — FIELD PREDICTION REPORT',
      '============================================================',
      `Date & Time:       ${new Date(result.created_at).toLocaleString()}`,
      `Prediction ID:     ${result.prediction_id}`,
      `Model Architecture: LightTeaNet-ECA (101,940 params)`,
      `Model Version:     ${result.model_version}`,
      `Inference Latency: ${result.inference_time_ms.toFixed(1)} ms`,
      '------------------------------------------------------------',
      'PRIMARY CLASSIFICATION',
      '------------------------------------------------------------',
      `Predicted Category: ${result.predicted_class}`,
      `Confidence Score:   ${(result.confidence * 100).toFixed(2)}%`,
      `Scientific Name:    ${diseaseInfo?.scientificName || 'N/A'}`,
      `Class Category:     ${diseaseInfo?.categoryLabel || 'N/A'}`,
      '',
      '------------------------------------------------------------',
      'TOP-3 PREDICTIONS',
      '------------------------------------------------------------',
      ...result.top_predictions.map(
        (p, idx) => `  ${idx + 1}. ${p.class_name.padEnd(24)}: ${(p.confidence * 100).toFixed(2)}%`
      ),
      '',
      '------------------------------------------------------------',
      'AGRONOMIC MANAGEMENT & NEXT STEPS',
      '------------------------------------------------------------',
      ...(diseaseInfo?.symptoms?.map((s) => `  * Symptom: ${s}`) || []),
      '',
      ...(diseaseInfo?.recommendedNextSteps?.map((step) => `  * Action: ${step}`) || []),
      '',
      '------------------------------------------------------------',
      'IMPORTANT RESEARCH & REGULATORY DISCLAIMER',
      '------------------------------------------------------------',
      diseaseInfo?.disclaimer ||
        'Model predictions are probabilistic AI outputs and do not guarantee agricultural correctness. Consult certified plant pathologists before chemical applications.',
      '============================================================',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teavision-report-${result.prediction_id.slice(0, 8)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Primary Classification Card */}
      <div className="card p-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-tv-secondary">
                AI Classification Result
              </span>
              {diseaseInfo && (
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${categoryBadgeClass}`}>
                  {diseaseInfo.categoryLabel}
                </span>
              )}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-tv-primary">
              {result.predicted_class}
            </h2>
            {diseaseInfo?.scientificName && (
              <p className="text-xs italic text-tv-secondary mt-0.5 font-serif">
                {diseaseInfo.scientificName}
              </p>
            )}
          </div>

          <div className="flex sm:flex-col items-end gap-1">
            <span
              className={`badge text-sm font-semibold px-3 py-1.5 ${
                isHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
              }`}
            >
              {isHealthy ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Healthy Leaf
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" /> Disease Detected
                </>
              )}
            </span>
          </div>
        </div>

        {/* Thumbnail Preview if provided */}
        {previewUrl && (
          <div className="mb-5 rounded-xl overflow-hidden bg-forest-950/5 border border-forest-900/10 flex items-center justify-center max-h-56">
            <img
              src={previewUrl}
              alt="Analyzed tea leaf"
              className="max-h-56 object-contain w-full"
            />
          </div>
        )}

        {/* Confidence Gauge */}
        <div className="mb-5 bg-surface rounded-xl p-4 border border-forest-900/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-tv-primary">Confidence Score</span>
            <span className="text-base font-bold text-tv-primary tab-nums font-mono">
              {(result.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="confidence-bar h-2.5">
            <div
              className={`confidence-fill ${isHealthy ? 'bg-emerald-600' : 'bg-forest-800'}`}
              style={{ width: `${Math.min(result.confidence * 100, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-tv-secondary mt-2">
            Probabilistic confidence score computed via Softmax from LightTeaNet-ECA logits.
          </p>
        </div>

        {/* Low Confidence Warning */}
        {isLowConfidence && (
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-900">Uncertain Prediction (Confidence &lt; 60%)</p>
              <p className="text-xs text-amber-800 mt-0.5">
                The model confidence is below the high-reliability threshold. This may be caused by atypical lighting, leaf blur, or uncommon leaf angle. An agricultural officer or expert should verify this leaf.
              </p>
            </div>
          </div>
        )}

        {/* Metadata Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-tv-secondary border-t border-forest-900/10 pt-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-forest-700" />
            <span className="tab-nums">{result.inference_time_ms.toFixed(1)} ms</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-forest-700" />
            <span>{result.model_version}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-forest-700" />
            <span>7 Classes (KD)</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Info className="w-3.5 h-3.5 text-forest-700 flex-shrink-0" />
            <span className="truncate" title={result.prediction_id}>
              ID: {result.prediction_id.slice(0, 8)}…
            </span>
          </div>
        </div>
      </div>

      {/* Image Quality Assessment (Phase 6) */}
      {result.quality_assessment && (
        <ImageQualityBadge quality={result.quality_assessment} />
      )}

      {/* Top 3 Predictions Card */}
      <div className="card p-5">
        <h3 className="font-display font-semibold text-sm text-tv-primary mb-3">
          Top-3 Candidate Predictions
        </h3>
        <div className="space-y-3">
          {result.top_predictions.map((pred, i) => (
            <div key={pred.class_name}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm ${i === 0 ? 'font-semibold text-tv-primary' : 'text-tv-secondary'}`}>
                  {i + 1}. {pred.class_name}
                </span>
                <span className="text-sm font-medium tab-nums font-mono text-tv-primary">
                  {(pred.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="confidence-bar h-1.5">
                <div
                  className="confidence-fill"
                  style={{
                    width: `${pred.confidence * 100}%`,
                    opacity: i === 0 ? 1 : 0.45,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Attention Heatmap / Explainable AI (Phase 6) */}
      <AttentionHeatmap
        originalUrl={previewUrl}
        heatmapOverlay={result.heatmap_overlay}
        saliencyHeatmap={result.saliency_heatmap}
        explanationNote={result.explanation_note}
      />

      {/* Diagnostic Assessment (Context-Aware Diagnostic Engine) */}
      {result.diagnosis && (
        <DiagnosticAssessmentCard assessment={result.diagnosis} />
      )}

      {/* Full 7-Class Distribution Chart */}
      <div className="card p-5">
        <ProbabilityChart
          probabilities={result.probabilities}
          predictedClass={result.predicted_class}
        />
      </div>

      {/* Agronomic Interpretation & Guidance */}
      {diseaseInfo && (
        <div className="card p-6 border-forest-900/15">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-forest-700" />
              <h3 className="font-display font-semibold text-base text-tv-primary">
                Agronomic Intelligence &amp; Field Guidance
              </h3>
            </div>
            <button
              onClick={() => setShowFullGuidance(!showFullGuidance)}
              className="text-xs text-forest-700 hover:text-forest-900 font-medium inline-flex items-center gap-1"
            >
              {showFullGuidance ? (
                <>
                  <span>Hide Details</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Show Details</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          <p className="text-sm text-tv-secondary leading-relaxed mb-4">
            {diseaseInfo.summary}
          </p>

          {showFullGuidance && (
            <div className="space-y-4 pt-2 border-t border-forest-900/10 animate-fade-in">
              {/* Typical Symptoms */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-tv-primary mb-2">
                  Typical Foliar Symptoms
                </h4>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {diseaseInfo.symptoms.map((symptom, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-tv-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 flex-shrink-0" />
                      <span>{symptom}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preventive Practices */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-tv-primary mb-2">
                  Preventive &amp; Cultural Practices
                </h4>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {diseaseInfo.preventivePractices.map((practice, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-tv-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-forest-700 mt-1.5 flex-shrink-0" />
                      <span>{practice}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Next Steps */}
              <div className="bg-forest-50/60 rounded-xl p-3.5 border border-forest-900/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-forest-900 mb-2">
                  Recommended Field Next Steps
                </h4>
                <ul className="space-y-1.5">
                  {diseaseInfo.recommendedNextSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-forest-950 font-medium">
                      <span className="w-4 h-4 rounded-full bg-forest-200 text-forest-900 flex items-center justify-center text-[10px] flex-shrink-0 font-bold">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-2 text-[11px] text-tv-secondary bg-surface rounded-lg p-3 border border-forest-900/8">
                <ShieldAlert className="w-4 h-4 text-forest-600 flex-shrink-0 mt-0.5" />
                <p>{diseaseInfo.disclaimer}</p>
              </div>

              {/* Link to Disease Library */}
              <div className="pt-2 text-right">
                <Link
                  to={`/diseases#${diseaseInfo.id}`}
                  className="text-xs font-medium text-forest-700 hover:text-forest-900 inline-flex items-center gap-1 hover:underline"
                >
                  <span>Read complete literature in Disease Library</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Field Assessment Feedback */}
      <FeedbackWidget predictionId={result.prediction_id} />

      {/* Field Environmental Observation (Module 7) */}
      <FieldObservationForm predictionId={result.prediction_id} />

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={() => setShowAssistant(true)}
          className="w-full bg-forest-900 hover:bg-forest-950 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Bot className="w-4 h-4 text-emerald-400" />
          <span>Consult AI Agronomist about {result.predicted_class}</span>
        </button>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={downloadReport} className="btn-secondary flex-1 justify-center">
            <Download className="w-4 h-4" />
            <span>Download Report (.txt)</span>
          </button>
          <button onClick={onReset} className="btn-primary flex-1 justify-center">
            <Leaf className="w-4 h-4" />
            <span>Scan Another Leaf</span>
          </button>
        </div>
      </div>

      {/* AI Agronomist Assistant Drawer (Phase 6) */}
      <AIAssistantDrawer
        isOpen={showAssistant}
        onClose={() => setShowAssistant(false)}
        contextDisease={result.predicted_class}
      />
    </div>
  );
}
