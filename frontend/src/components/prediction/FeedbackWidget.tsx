import { useState, type FormEvent } from 'react';
import { Check, ThumbsUp, ThumbsDown, HelpCircle, Send, Loader2 } from 'lucide-react';
import { submitFeedback } from '../../services/api';
import type { FeedbackPayload } from '../../types';

interface Props {
  predictionId: string;
}

export default function FeedbackWidget({ predictionId }: Props) {
  const [assessment, setAssessment] = useState<'correct' | 'incorrect' | 'unsure' | null>(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!assessment) return;

    setSubmitting(true);
    setError(null);

    const payload: FeedbackPayload = {
      prediction_id: predictionId,
      user_assessment: assessment,
      comments: comments.trim() ? comments.trim() : undefined,
    };

    try {
      await submitFeedback(payload);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-forest-50 border border-forest-200 rounded-xl p-4 text-center animate-fade-in">
        <div className="w-8 h-8 rounded-full bg-forest-600 text-white flex items-center justify-center mx-auto mb-2">
          <Check className="w-4 h-4" />
        </div>
        <p className="text-sm font-semibold text-tv-primary">Thank you for your feedback!</p>
        <p className="text-xs text-tv-secondary mt-1">
          Your field observation has been logged for plantation research and validation auditing.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-forest-900/10 rounded-xl p-4">
      <div className="mb-3">
        <h4 className="font-display font-semibold text-sm text-tv-primary">
          Field Assessment Feedback
        </h4>
        <p className="text-xs text-tv-secondary mt-0.5">
          Does this AI diagnosis match your field observation?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setAssessment('correct')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
              assessment === 'correct'
                ? 'bg-forest-900 text-white border-forest-900 shadow-sm'
                : 'bg-white text-tv-secondary border-forest-900/15 hover:border-forest-600/40 hover:bg-forest-50/50'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Appears Correct</span>
          </button>

          <button
            type="button"
            onClick={() => setAssessment('incorrect')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
              assessment === 'incorrect'
                ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                : 'bg-white text-tv-secondary border-forest-900/15 hover:border-forest-600/40 hover:bg-forest-50/50'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>Appears Incorrect</span>
          </button>

          <button
            type="button"
            onClick={() => setAssessment('unsure')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
              assessment === 'unsure'
                ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                : 'bg-white text-tv-secondary border-forest-900/15 hover:border-forest-600/40 hover:bg-forest-50/50'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Not Sure</span>
          </button>
        </div>

        {assessment && (
          <div className="space-y-2 pt-1 animate-fade-in">
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Optional notes: symptoms seen, leaf age, weather, or estate block..."
              rows={2}
              className="w-full text-xs rounded-lg border border-forest-900/15 p-2.5 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
            />

            {error && (
              <p className="text-xs text-rose-600">{error}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-tv-secondary">
                Feedback supports research and does not alter ground truth.
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Submitting…</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
