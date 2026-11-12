import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf,
  Scan,
  History,
  Search,
  Clock,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Loader2,
  BarChart2,
  BookOpen,
} from 'lucide-react';
import { getPredictions, getPrediction } from '../services/api';
import type { PredictionResult, PredictionDetail } from '../types';
import { DISEASE_CLASSES } from '../lib/constants';

export default function HistoryPage() {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [selectedDisease, setSelectedDisease] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeDetail, setActiveDetail] = useState<PredictionDetail | null>(null);

  useEffect(() => {
    let ignore = false;
    getPredictions({
      limit,
      offset: page * limit,
      disease: selectedDisease || undefined,
      search: search.trim() || undefined,
    })
      .then((data) => {
        if (!ignore) {
          setPredictions(data.items);
          setTotal(data.total);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to load predictions:', err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [page, limit, selectedDisease, search]);

  const openDetail = async (id: string) => {
    try {
      const detail = await getPrediction(id);
      setActiveDetail(detail);
    } catch (err) {
      console.error('Failed to load prediction details:', err);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation */}
      <nav className="border-b border-forest-900/8 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="section-wrapper">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest-900 to-forest-700 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-tv-primary">
                TeaVision AI
              </span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/dashboard"
                className="text-xs sm:text-sm font-medium text-tv-secondary hover:text-tv-primary flex items-center gap-1 transition-colors"
              >
                <BarChart2 className="w-4 h-4 text-forest-700" />
                <span className="hidden sm:inline">Analytics</span>
              </Link>
              <Link
                to="/diseases"
                className="text-xs sm:text-sm font-medium text-tv-secondary hover:text-tv-primary flex items-center gap-1 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-forest-700" />
                <span className="hidden sm:inline">Library</span>
              </Link>
              <Link to="/scan" className="btn-primary text-xs sm:text-sm py-2 px-3 sm:px-4">
                <Scan className="w-4 h-4" />
                <span>Scan Leaf</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="section-wrapper py-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-tv-primary">
              Prediction History
            </h1>
            <p className="text-sm text-tv-secondary">
              Review and audit all recorded tea leaf inferences, feedback, and field logs.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-tv-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by diagnosis or prediction UUID..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-forest-900/15 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
            />
          </div>

          <div className="w-full md:w-64">
            <select
              value={selectedDisease}
              onChange={(e) => {
                setSelectedDisease(e.target.value);
                setPage(0);
              }}
              className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-forest-900/15 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
            >
              <option value="">All Categories ({DISEASE_CLASSES.length})</option>
              {DISEASE_CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between text-xs text-tv-secondary mb-3">
          <span>Total records: {total}</span>
          {totalPages > 1 && (
            <span>
              Page {page + 1} of {totalPages}
            </span>
          )}
        </div>

        {/* List of Predictions */}
        {loading ? (
          <div className="card p-12 text-center">
            <Loader2 className="w-8 h-8 text-forest-700 animate-spin mx-auto mb-2" />
            <p className="text-sm text-tv-secondary">Loading prediction logs…</p>
          </div>
        ) : predictions.length === 0 ? (
          <div className="card p-12 text-center">
            <History className="w-12 h-12 text-forest-900/20 mx-auto mb-3" />
            <h3 className="font-display font-semibold text-tv-primary mb-1">
              No predictions found
            </h3>
            <p className="text-xs text-tv-secondary mb-4">
              {search || selectedDisease
                ? 'Try adjusting your search query or filter.'
                : 'Perform an AI leaf scan to start recording field observations.'}
            </p>
            <Link to="/scan" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5">
              <Scan className="w-4 h-4" />
              <span>Scan a Leaf</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {predictions.map((pred) => {
              const isHealthy = pred.predicted_class === 'Healthy leaf';

              return (
                <div
                  key={pred.prediction_id}
                  onClick={() => openDetail(pred.prediction_id)}
                  className="card p-4 hover:border-forest-600/40 hover:shadow-card-lg transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {isHealthy ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-base text-tv-primary">
                          {pred.predicted_class}
                        </h3>
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-forest-50 border border-forest-200 text-forest-800">
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-tv-secondary mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-forest-700" />
                          <span>{new Date(pred.created_at).toLocaleString()}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-forest-700" />
                          <span>{pred.inference_time_ms.toFixed(1)} ms</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetail(pred.prediction_id);
                      }}
                      className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-forest-900/10">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <span className="text-xs text-tv-secondary">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1 disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal Drawer */}
      {activeDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-up">
            <div className="flex items-center justify-between mb-4 border-b border-forest-900/10 pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-tv-secondary">
                  Prediction Details
                </span>
                <h3 className="font-display text-xl font-bold text-tv-primary">
                  {activeDetail.predicted_class}
                </h3>
              </div>
              <button
                onClick={() => setActiveDetail(null)}
                className="w-8 h-8 rounded-full hover:bg-forest-100 flex items-center justify-center text-tv-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Primary Stats */}
              <div className="grid grid-cols-2 gap-2 bg-surface p-3 rounded-xl border border-forest-900/10 text-xs">
                <div>
                  <span className="text-tv-secondary block">Confidence:</span>
                  <span className="font-bold font-mono text-tv-primary text-sm">
                    {(activeDetail.confidence * 100).toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-tv-secondary block">Inference Time:</span>
                  <span className="font-bold font-mono text-tv-primary text-sm">
                    {activeDetail.inference_time_ms.toFixed(1)} ms
                  </span>
                </div>
                <div>
                  <span className="text-tv-secondary block">Model Version:</span>
                  <span className="font-medium text-tv-primary">{activeDetail.model_version}</span>
                </div>
                <div>
                  <span className="text-tv-secondary block">Recorded:</span>
                  <span className="font-medium text-tv-primary">
                    {new Date(activeDetail.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Top-3 Candidates */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-tv-primary mb-2">
                  Top-3 Candidates
                </h4>
                <div className="space-y-2">
                  {activeDetail.top_predictions.map((p, i) => (
                    <div key={p.class_name} className="flex items-center justify-between text-xs">
                      <span className="text-tv-secondary">
                        {i + 1}. {p.class_name}
                      </span>
                      <span className="font-bold font-mono text-tv-primary">
                        {(p.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Field Observation if any */}
              {activeDetail.field_observation && (
                <div className="bg-forest-50/60 p-3.5 rounded-xl border border-forest-900/10 text-xs">
                  <h4 className="font-bold text-forest-900 uppercase tracking-wider mb-2">
                    Field Observation
                  </h4>
                  {activeDetail.field_observation.plantation_name && (
                    <p className="text-forest-950 mb-1">
                      <strong>Plantation:</strong> {activeDetail.field_observation.plantation_name}
                    </p>
                  )}
                  {activeDetail.field_observation.district && (
                    <p className="text-forest-950 mb-1">
                      <strong>District:</strong> {activeDetail.field_observation.district}
                    </p>
                  )}
                  {activeDetail.field_observation.lighting_condition && (
                    <p className="text-forest-950 mb-1">
                      <strong>Lighting:</strong> {activeDetail.field_observation.lighting_condition}
                    </p>
                  )}
                  {activeDetail.field_observation.observation_notes && (
                    <p className="text-forest-950 mt-1 italic">
                      "{activeDetail.field_observation.observation_notes}"
                    </p>
                  )}
                </div>
              )}

              {/* User Feedback if any */}
              {activeDetail.feedback && activeDetail.feedback.length > 0 && (
                <div className="bg-surface p-3.5 rounded-xl border border-forest-900/10 text-xs">
                  <h4 className="font-bold text-tv-primary uppercase tracking-wider mb-2">
                    User Feedback
                  </h4>
                  {activeDetail.feedback.map((f) => (
                    <div key={f.id} className="mb-1">
                      <span className="font-semibold capitalize text-forest-800">
                        {f.user_assessment}
                      </span>
                      {f.comments && <p className="italic text-tv-secondary mt-0.5">"{f.comments}"</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Close button */}
              <div className="pt-2 text-right">
                <button
                  onClick={() => setActiveDetail(null)}
                  className="btn-primary text-xs py-2 px-4"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
