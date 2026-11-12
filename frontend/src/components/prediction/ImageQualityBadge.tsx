import { useState } from 'react';
import { Sparkles, Sun, Eye, ChevronDown, ChevronUp, CheckCircle, Info } from 'lucide-react';
import type { QualityAssessment } from '../../types';

interface Props {
  quality: QualityAssessment;
}

export default function ImageQualityBadge({ quality }: Props) {
  const [showTips, setShowTips] = useState(false);

  const ratingColors = {
    excellent: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    good: 'bg-blue-50 text-blue-800 border-blue-200',
    fair: 'bg-amber-50 text-amber-800 border-amber-200',
  }[quality.quality_rating] || 'bg-gray-50 text-gray-800 border-gray-200';

  return (
    <div className="bg-surface rounded-xl border border-forest-900/10 p-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-forest-100 flex items-center justify-center flex-shrink-0 text-forest-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-tv-primary">Image Quality Analysis</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ratingColors}`}>
                {quality.quality_rating}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-tv-secondary mt-0.5">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-forest-700" />
                <span>Sharpness: {quality.blur_score > 100 ? 'Crisp' : 'Moderate'} ({quality.blur_score.toFixed(0)})</span>
              </span>
              <span className="flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-600" />
                <span>Lighting: {quality.lighting_label}</span>
              </span>
            </div>
          </div>
        </div>

        {quality.feedback_tips.length > 0 && (
          <button
            onClick={() => setShowTips(!showTips)}
            className="text-xs text-forest-700 hover:text-forest-900 font-medium flex items-center gap-1 self-start sm:self-center"
          >
            <span>{showTips ? 'Hide Tips' : 'View Tips'}</span>
            {showTips ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {showTips && quality.feedback_tips.length > 0 && (
        <div className="mt-3 pt-3 border-t border-forest-900/10 space-y-1.5 animate-fade-in text-xs text-tv-secondary">
          {quality.feedback_tips.map((tip, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-forest-600 flex-shrink-0 mt-0.5" />
              <span>{tip}</span>
            </div>
          ))}
          <p className="text-[10px] text-tv-secondary pt-1 italic flex items-center gap-1">
            <Info className="w-3 h-3 flex-shrink-0" />
            <span>High-quality, focused images provide the most reliable LightTeaNet-ECA inferences.</span>
          </p>
        </div>
      )}
    </div>
  );
}

