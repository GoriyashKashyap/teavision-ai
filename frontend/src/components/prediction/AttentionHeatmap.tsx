import { useState } from 'react';
import { Eye, Layers, Flame, Info, Sliders } from 'lucide-react';

interface Props {
  originalUrl?: string;
  heatmapOverlay?: string;
  saliencyHeatmap?: string;
  explanationNote?: string;
}

export default function AttentionHeatmap({
  originalUrl,
  heatmapOverlay,
  saliencyHeatmap,
  explanationNote,
}: Props) {
  const [viewMode, setViewMode] = useState<'overlay' | 'heatmap' | 'original'>('overlay');
  const [opacity, setOpacity] = useState<number>(0.65);

  if (!heatmapOverlay && !saliencyHeatmap) {
    return null;
  }

  return (
    <div className="card p-5 border border-forest-900/15">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Flame className="w-4 h-4 text-amber-600" />
            <h3 className="font-display font-semibold text-base text-tv-primary">
              AI Visual Attention &amp; Saliency Map
            </h3>
          </div>
          <p className="text-xs text-tv-secondary">
            Gradient-weighted leaf regions that most heavily influenced this prediction.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-forest-100/60 p-1 rounded-lg border border-forest-900/10 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode('overlay')}
            className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              viewMode === 'overlay'
                ? 'bg-white text-forest-900 shadow-sm'
                : 'text-tv-secondary hover:text-tv-primary'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Overlay</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('heatmap')}
            className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              viewMode === 'heatmap'
                ? 'bg-white text-forest-900 shadow-sm'
                : 'text-tv-secondary hover:text-tv-primary'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-600" />
            <span>Heatmap</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('original')}
            className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              viewMode === 'original'
                ? 'bg-white text-forest-900 shadow-sm'
                : 'text-tv-secondary hover:text-tv-primary'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Leaf</span>
          </button>
        </div>
      </div>

      {/* Main Visual Frame */}
      <div className="relative rounded-xl overflow-hidden bg-forest-950/5 border border-forest-900/15 flex items-center justify-center max-h-72 aspect-video mb-3">
        {viewMode === 'original' && (
          <img
            src={originalUrl || heatmapOverlay}
            alt="Original leaf"
            className="w-full h-full object-contain max-h-72"
          />
        )}

        {viewMode === 'heatmap' && saliencyHeatmap && (
          <img
            src={saliencyHeatmap}
            alt="Saliency heatmap activation map"
            className="w-full h-full object-contain max-h-72"
          />
        )}

        {viewMode === 'overlay' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {originalUrl && (
              <img
                src={originalUrl}
                alt="Base leaf"
                className="w-full h-full object-contain max-h-72"
              />
            )}
            {saliencyHeatmap && (
              <img
                src={saliencyHeatmap}
                alt="Heatmap layer"
                style={{ opacity }}
                className="absolute inset-0 w-full h-full object-contain max-h-72 mix-blend-multiply"
              />
            )}
            {!originalUrl && heatmapOverlay && (
              <img
                src={heatmapOverlay}
                alt="Blended attention overlay"
                className="w-full h-full object-contain max-h-72"
              />
            )}
          </div>
        )}
      </div>

      {/* Opacity Slider for Overlay */}
      {viewMode === 'overlay' && (
        <div className="flex items-center gap-3 bg-surface px-3 py-2 rounded-lg border border-forest-900/10 mb-3 text-xs">
          <Sliders className="w-3.5 h-3.5 text-tv-secondary" />
          <span className="text-tv-secondary text-[11px] font-medium">Heatmap Opacity:</span>
          <input
            type="range"
            min={0.2}
            max={1.0}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="flex-1 accent-forest-700 h-1.5 bg-forest-200 rounded-lg cursor-pointer"
          />
          <span className="text-[11px] font-mono text-tv-primary font-bold">
            {(opacity * 100).toFixed(0)}%
          </span>
        </div>
      )}

      {/* Heatmap Legend Bar */}
      <div className="space-y-1 mb-3">
        <div className="h-2 rounded-full w-full bg-gradient-to-r from-blue-600 via-green-500 via-yellow-400 to-red-600 shadow-inner" />
        <div className="flex justify-between text-[10px] text-tv-secondary font-mono">
          <span>0.0 Minimal Evidence (Blue)</span>
          <span>0.5 Moderate</span>
          <span>1.0 Primary Focus (Red)</span>
        </div>
      </div>

      {/* Scientific Explanation Note */}
      <div className="bg-surface rounded-lg p-3 border border-forest-900/10 flex items-start gap-2 text-xs text-tv-secondary">
        <Info className="w-3.5 h-3.5 text-forest-700 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {explanationNote ||
            "Heatmap highlights pixel regions whose gradients contributed most positively to the LightTeaNet-ECA classification score. It confirms model focus on actual foliar lesions rather than background artifacts."}
        </p>
      </div>
    </div>
  );
}

