import { useState, useEffect } from 'react';
import { Cpu, Check, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import type { ModelOption } from '../../types';
import { listModels } from '../../services/api';

interface Props {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  disabled?: boolean;
  className?: string;
}

const FALLBACK_MODELS: ModelOption[] = [
  {
    id: 'lightteanet-eca-kd',
    name: 'LightTeaNet-ECA',
    display_name: 'LightTeaNet-ECA (KD Student)',
    architecture: 'LightTeaNet-ECA',
    family: 'Student (Distilled)',
    parameters: 101940,
    format: 'TorchScript (.pt)',
    is_default: true,
    badge: 'Primary (101K params)',
    description: 'Custom lightweight student CNN with ECA attention, distilled from MobileViT-XXS. Primary research model.',
    available: true,
  },
  {
    id: 'lightteanet-se',
    name: 'LightTeaNet-SE',
    display_name: 'LightTeaNet-SE (Student)',
    architecture: 'LightTeaNet-SE',
    family: 'Student',
    parameters: 76000,
    format: 'TorchScript (.pt)',
    is_default: false,
    badge: 'Ultra-Fast (29ms)',
    description: 'Ultra-lightweight student CNN variant with Squeeze-and-Excitation attention blocks.',
    available: true,
  },
  {
    id: 'mobilenetv2-baseline',
    name: 'MobileNetV2',
    display_name: 'MobileNetV2 (Baseline)',
    architecture: 'MobileNetV2',
    family: 'Baseline CNN',
    parameters: 2232839,
    format: 'PyTorch StateDict (.pth)',
    is_default: false,
    badge: 'Baseline CNN (2.2M)',
    description: 'Standard MobileNetV2 inverted residual network trained directly on tea leaf dataset as an empirical baseline.',
    available: true,
  },
  {
    id: 'mobilevit-xxs',
    name: 'MobileViT-XXS',
    display_name: 'MobileViT-XXS (Teacher)',
    architecture: 'MobileViT-XXS',
    family: 'Vision Transformer Teacher',
    parameters: 953271,
    format: 'PyTorch ByobNet (.pkl)',
    is_default: false,
    badge: 'Teacher (0.95M)',
    description: 'Mobile Vision Transformer (XXS) teacher model combining separable convolutions with multi-head self-attention.',
    available: true,
  },
  {
    id: 'mobilevit-s',
    name: 'MobileViT-S',
    display_name: 'MobileViT-S (Heavy Teacher)',
    architecture: 'MobileViT-S',
    family: 'Vision Transformer Teacher',
    parameters: 4942119,
    format: 'PyTorch ByobNet (.pkl)',
    is_default: false,
    badge: 'Heavy Teacher (4.9M)',
    description: 'High-capacity MobileViT-S teacher model with deep transformer blocks for high-representation learning.',
    available: true,
  },
];

export default function ModelSelector({
  selectedModelId,
  onSelectModel,
  disabled = false,
  className = '',
}: Props) {
  const [models, setModels] = useState<ModelOption[]>(FALLBACK_MODELS);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    listModels()
      .then((data) => {
        if (data && data.length > 0) {
          setModels(data);
        }
      })
      .catch(() => {
        // Fallback static models are already in place
      });
  }, []);

  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0];

  return (
    <div className={`card p-4 border border-forest-900/15 transition-all ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-forest-100 flex items-center justify-center text-forest-800">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-tv-primary uppercase tracking-wide">
                Inference Model
              </span>
              <span className="text-[10px] bg-forest-900 text-white px-1.5 py-0.2 rounded font-mono font-medium">
                {selectedModel.architecture}
              </span>
            </div>
            <p className="text-[11px] text-tv-secondary truncate max-w-xs sm:max-w-md">
              {selectedModel.display_name} • {selectedModel.family}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-forest-700 hover:text-forest-900 font-medium inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface hover:bg-forest-50 border border-forest-900/10 transition-colors disabled:opacity-50"
        >
          <span>{isExpanded ? 'Done' : 'Change Model'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Selection Grid */}
      {isExpanded && (
        <div className="mt-3.5 pt-3 border-t border-forest-900/10 space-y-2 animate-fade-in">
          <p className="text-[11px] text-tv-secondary mb-2">
            Select an architecture to compare student vs. teacher knowledge distillation or baseline CNN performance:
          </p>

          <div className="grid gap-2">
            {models.map((m) => {
              const isSelected = m.id === selectedModelId;
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onSelectModel(m.id);
                    setIsExpanded(false);
                  }}
                  className={`text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-forest-900 text-white border-forest-900 shadow-sm'
                      : 'bg-white hover:bg-forest-50/70 border-forest-900/10 text-tv-primary'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-display font-bold text-xs">
                        {m.display_name}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                          isSelected
                            ? 'bg-emerald-400 text-forest-950'
                            : 'bg-forest-100 text-forest-800'
                        }`}
                      >
                        {m.badge}
                      </span>
                      {m.is_default && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                            isSelected ? 'bg-forest-800 text-emerald-300' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Default Research Model
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-[11px] leading-relaxed line-clamp-2 ${
                        isSelected ? 'text-forest-100' : 'text-tv-secondary'
                      }`}
                    >
                      {m.description}
                    </p>

                    <div
                      className={`mt-2 flex items-center gap-3 text-[10px] font-mono ${
                        isSelected ? 'text-forest-200' : 'text-forest-700'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>{m.parameters.toLocaleString()} params</span>
                      </span>
                      <span>•</span>
                      <span>{m.family}</span>
                      <span>•</span>
                      <span>{m.format}</span>
                    </div>
                  </div>

                  <div className="flex items-center mt-1 flex-shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-400 text-forest-950'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-3" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
