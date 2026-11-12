import { useState, type FormEvent } from 'react';
import { MapPin, Sun, Calendar, FileText, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { submitFieldObservation } from '../../services/api';
import type { FieldObservationPayload } from '../../types';

interface Props {
  predictionId: string;
}

export default function FieldObservationForm({ predictionId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [plantationName, setPlantationName] = useState('');
  const [district, setDistrict] = useState('');
  const [lighting, setLighting] = useState<FieldObservationPayload['lighting_condition']>('unknown');
  const [leafAge, setLeafAge] = useState<FieldObservationPayload['leaf_age']>('unknown');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: FieldObservationPayload = {
      prediction_id: predictionId,
      plantation_name: plantationName.trim() || undefined,
      district: district.trim() || undefined,
      lighting_condition: lighting,
      leaf_age: leafAge,
      observation_notes: notes.trim() || undefined,
    };

    try {
      await submitFieldObservation(payload);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit observation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center animate-fade-in">
        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-2">
          <Check className="w-4 h-4" />
        </div>
        <p className="text-sm font-semibold text-emerald-950">Field Observation Logged</p>
        <p className="text-xs text-emerald-800 mt-1">
          Your plantation environmental data has been associated with this prediction for field research.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-4 border border-forest-900/15">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-forest-700" />
          <div>
            <h4 className="font-display font-semibold text-sm text-tv-primary">
              Record Field Observation (Optional)
            </h4>
            <p className="text-xs text-tv-secondary">
              Contribute plantation location, lighting, and environmental context for research.
            </p>
          </div>
        </div>
        <div className="text-forest-800">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-forest-900/10 space-y-3 animate-fade-in">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-tv-primary mb-1">
                Plantation / Estate Name
              </label>
              <input
                type="text"
                value={plantationName}
                onChange={(e) => setPlantationName(e.target.value)}
                placeholder="e.g. Pedro Estate, Labookellie..."
                className="w-full text-xs rounded-lg border border-forest-900/15 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-forest-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-tv-primary mb-1">
                District / Region
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Nuwara Eliya, Kandy, Badulla..."
                className="w-full text-xs rounded-lg border border-forest-900/15 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-forest-700"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-tv-primary mb-1 flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-600" />
                <span>Lighting Condition</span>
              </label>
              <select
                value={lighting}
                onChange={(e) => setLighting(e.target.value as any)}
                className="w-full text-xs rounded-lg border border-forest-900/15 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-forest-700"
              >
                <option value="unknown">Not Specified</option>
                <option value="direct_sunlight">Direct Sunlight (Bright)</option>
                <option value="overcast">Overcast / Diffused Sky</option>
                <option value="shaded">Shaded Under Canopy</option>
                <option value="indoor_lab">Indoor / Laboratory Lighting</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-tv-primary mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-forest-700" />
                <span>Leaf Age / Tier</span>
              </label>
              <select
                value={leafAge}
                onChange={(e) => setLeafAge(e.target.value as any)}
                className="w-full text-xs rounded-lg border border-forest-900/15 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-forest-700"
              >
                <option value="unknown">Not Specified</option>
                <option value="tender_flush">Tender Flush / Bud (Top 1-2 Leaves)</option>
                <option value="maintenance_mature">Maintenance Mature Foliage</option>
                <option value="old_coarse">Old / Coarse Lower Foliage</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-tv-primary mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-forest-700" />
              <span>Observation Notes</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Spotting noticed across 5 bushes in sector B; high humidity after rain..."
              rows={2}
              className="w-full text-xs rounded-lg border border-forest-900/15 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <span>Save Field Observation</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

