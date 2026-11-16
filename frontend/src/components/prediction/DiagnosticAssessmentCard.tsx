import { useState } from 'react';
import { Info, ShieldAlert, Leaf, FileText, MapPin } from 'lucide-react';
import type { DiagnosticAssessment } from '../../types';

interface Props {
  assessment: DiagnosticAssessment;
  onExpertReview?: (assessment: DiagnosticAssessment) => void;
}

export default function DiagnosticAssessmentCard({ assessment }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const cause = assessment.possible_cause;
  const evidence = assessment.confidence_evidence;
  const recs = assessment.recommendations;
  const missing = assessment.missing_information;
  const contributing = assessment.contributing_factors;

  const severityClass = evidence.strength === "insufficient"
    ? "rose-600"
    : evidence.strength === "weak"
      ? "amber-600"
      : evidence.strength === "moderate"
        ? "amber-800"
        : "emerald-600";

  return (
    <div className="card p-6 border border-forest-900/20 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Category Badge */}
        <div className={`p-2 rounded-full ${assessment.detected_category === "Healthy leaf"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-800 border-amber-300"} text-sm font-medium`}>
          {assessment.detected_category}
        </div>

        {/* Evidence Strength Badge */}
        <div className={`p-2 rounded bg-forest-50/60 text-[10px] font-medium ${severityClass}`}>
          {evidence.strength.toUpperCase()}
        </div>
      </div>

      {/* Possible Cause Section */}
      <div className="mt-4 pt-4 border-t border-forest-900/10">
        <h3 className="font-display font-semibold text-sm text-tv-primary mb-3">
          Possible Causal Agent
        </h3>

        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            cause.type === "documented" ? "bg-emerald-100 text-emerald-800" :
            cause.type === "contributing_factor" ? "bg-amber-100 text-amber-800" :
            cause.type === "hypothesis" ? "bg-orange-100 text-orange-800" :
            "bg-rose-100 text-rose-800"
          }`}>
            {cause.type.charAt(0).toUpperCase() + cause.type.slice(1)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-tv-primary truncate line-clamp-1">
              {cause.agent}
            </p>
            <p className="text-[10px] text-tv-secondary">
              {cause.type}
            </p>
          </div>
        </div>

        {cause.evidence.length > 0 && (
          <div className="mt-2 text-[10px] text-tv-secondary">
            <span className="font-semibold">Evidence:</span> {cause.evidence.join(" | ")}
          </div>
        )}
      </div>

      {/* Supporting Evidence */}
      {assessment.supporting_evidence.length > 0 && (
        <div className="mt-4">
          <h3 className="font-display font-semibold text-sm text-tv-primary mb-3">
            Supporting Evidence
          </h3>
          <ul className="space-y-1 text-[10px] text-tv-secondary">
            {assessment.supporting_evidence.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Info className="w-2 h-2 text-forest-600 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Contributing Factors */}
      {contributing.length > 0 && (
        <div className="mt-4">
          <h3 className="font-display font-semibold text-sm text-tv-primary mb-3">
            Environmental Contributing Factors
          </h3>
          <ul className="space-y-1 grid grid-cols-2 gap-2 text-[10px] text-tv-secondary">
            {contributing.map((f, idx) => (
              <li key={idx} className="p-1.5 rounded bg-forest-50/60 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full text-forest-500 flex-shrink-0" />
                <span>{f.factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Information */}
      {missing.length > 0 && (
        <div className="mt-4 p-3 bg-forest-50 border border-forest-900/10 rounded">
          <h3 className="font-display font-semibold text-sm text-tv-primary mb-2">
            <Info className="w-3.5 h-3.5 text-forest-600 flex-shrink-0 mr-1" />
            Missing Information
          </h3>
          <ul className="space-y-1 text-[10px] text-forest-700">
            {missing.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <FileText className="w-2 h-2 text-forest-500 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confidence Evidence */}
      <div className="mt-4 p-3 bg-surface rounded border border-forest-900/10">
        <h3 className="font-display font-semibold text-sm text-tv-primary mb-3">
          <Info className="w-3.5 h-3.5 text-forest-600 flex-shrink-0 mr-1" />
          Evidence Strength (Distinct from Model Confidence)
        </h3>
        <div className="grid grid-cols-2 gap-3 text-[10px] text-tv-secondary">
          <div>
            <span className="font-medium">Model Confidence:</span>
            <span className="text-tv-primary font-bold">{(evidence.model_confidence*100).toFixed(1)}%</span>
          </div>
          <div>
            <span className="font-medium">Diagnostic Strength:</span>
            <span className={`font-bold ${severityClass}`}>{evidence.strength.toUpperCase()}</span>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-forest-600 line-clamp-2">
          {evidence.explanation}
        </p>
        <p className="mt-2 text-xs text-forest-500">
          {evidence.distinct_from_reasoning}
        </p>
      </div>

      {/* Categorized Recommendations */}
      {isExpanded && recs && Object.keys(recs).length > 0 && (
        <div className="mt-5 pt-4 border-t border-forest-900/10">
          <h3 className="font-display font-semibold text-sm text-tv-primary mb-4">
            Recommended Next Steps
          </h3>

          {recs.cultural.length > 0 && (
            <div className="mb-3">
              <h4 className="font-display font-xs uppercase tracking-wider text-forest-600 mb-1">
                Cultural Practices
              </h4>
              <ul className="space-y-0.5 text-[10px] text-forest-700">
                {recs.cultural.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Leaf className="w-2 h-2 text-forest-500 flex-shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recs.sanitation.length > 0 && (
            <div className="mb-3">
              <h4 className="font-display font-xs uppercase tracking-wider text-forest-600 mb-1">
                Sanitation & Monitoring
              </h4>
              <ul className="space-y-0.5 text-[10px] text-forest-700">
                {recs.sanitation.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <ShieldAlert className="w-2 h-2 text-forest-500 flex-shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recs.drainage_canopy.length > 0 && (
            <div className="mb-3">
              <h4 className="font-display font-xs uppercase tracking-wider text-forest-600 mb-1">
                Drainage & Canopy Management
              </h4>
              <ul className="space-y-0.5 text-[10px] text-forest-700">
                {recs.drainage_canopy.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <MapPin className="w-2 h-2 text-forest-500 flex-shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recs.biological.length > 0 && (
            <div className="mb-3">
              <h4 className="font-display font-xs uppercase tracking-wider text-forest-600 mb-1">
                Biological Management
              </h4>
              <ul className="space-y-0.5 text-[10px] text-forest-700">
                {recs.biological.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Leaf className="w-2 h-2 text-forest-500 flex-shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recs.chemical.length > 0 && (
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded">
              <h4 className="font-display font-xs uppercase tracking-wider text-amber-700 text-[10px] mb-1">
                ⚠️ Chemical Management (Requires Official Guidance)
              </h4>
              <p className="text-[10px] text-amber-800">
                Chemical recommendations must always be verified with current official
                regional guidance, approved products, label requirements, application
                restrictions, and pre-harvest intervals. Never prescribe from image
                prediction alone.
              </p>
              <ul className="space-y-0.5 text-[10px] text-amber-700">
                {recs.chemical.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Info className="w-2 h-2 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Expert Verification Flag */}
      <div className="mt-4 p-3 border-2 border-forest-900/15 rounded-lg bg-forest-50/60 text-xs text-forest-700 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-forest-600 flex-shrink-0 mt-0.5" />
        <div>
          {assessment.requires_expert_verification ? (
            <span>
              <strong className="underline text-forest-800">Expert verification required</strong> &mdash;{' '}
              model prediction and AI diagnostic reasoning should be confirmed by an
              agricultural extension officer or certified plant pathologist before
              taking action.
            </span>
          ) : (
            <span>
              <strong className="underline text-emerald-600">Assessment complete</strong> &mdash;{' '}
              evidence gathered from model prediction, visual explanation, and field
              observations. Maintain regular monitoring.
            </span>
          )}
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <div className="mt-3 text-right">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[10px] text-forest-600 hover:text-forest-800 font-medium transition-colors"
        >
          {isExpanded ? "Hide Details" : "Show All Recommendations ▶"}
        </button>
      </div>
    </div>
  );
}