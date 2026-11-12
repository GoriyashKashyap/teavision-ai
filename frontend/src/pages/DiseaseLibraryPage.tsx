import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Leaf,
  Scan,
  Search,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Bug,
  Activity,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { DISEASE_LIBRARY } from '../data/diseases';

export default function DiseaseLibraryPage() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(() => {
    return location.hash ? location.hash.replace('#', '') : null;
  });

  // Scroll to hash if linked with anchor like #gray-blight
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location.hash]);

  const diseasesList = useMemo(() => Object.values(DISEASE_LIBRARY), []);

  const filteredDiseases = useMemo(() => {
    return diseasesList.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        item.className.toLowerCase().includes(q) ||
        (item.scientificName && item.scientificName.toLowerCase().includes(q)) ||
        item.summary.toLowerCase().includes(q) ||
        item.symptoms.some((s) => s.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [diseasesList, selectedCategory, searchQuery]);

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

            <div className="flex items-center gap-3">
              <Link
                to="/scan"
                className="btn-primary text-xs sm:text-sm py-2 px-3 sm:px-4"
              >
                <Scan className="w-4 h-4" />
                <span>Scan a Tea Leaf</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <section className="bg-white border-b border-forest-900/8 py-12 lg:py-16">
        <div className="section-wrapper max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-forest-100 text-forest-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Plant Pathology &amp; Agronomic Knowledge Base
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-tv-primary mb-4">
            Tea Leaf Condition Library
          </h1>

          <p className="text-tv-secondary text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Curated agricultural references for all 7 target classes evaluated by the LightTeaNet-ECA deep learning architecture.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="section-wrapper py-8 max-w-5xl mx-auto">
        {/* Search & Category Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-tv-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by symptom, name, fungus, pest..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-forest-900/15 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { id: 'all', label: 'All Classes (7)' },
              { id: 'fungal', label: 'Fungal Blights (2)' },
              { id: 'pest', label: 'Pest Damage (3)' },
              { id: 'algal', label: 'Algal Spot (1)' },
              { id: 'healthy', label: 'Healthy (1)' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-forest-900 text-white border-forest-900 shadow-sm'
                    : 'bg-white text-tv-secondary border-forest-900/10 hover:border-forest-600/30 hover:bg-forest-50/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <p className="text-xs text-tv-secondary mb-4">
          Showing {filteredDiseases.length} of {diseasesList.length} tea foliage conditions
        </p>

        {/* Disease Cards List */}
        <div className="space-y-6">
          {filteredDiseases.map((disease) => {
            const isExpanded = expandedId === disease.id || !!searchQuery;

            return (
              <div
                key={disease.id}
                id={disease.id}
                className="card overflow-hidden transition-all duration-200 border-forest-900/15 hover:border-forest-600/40"
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : disease.id)}
                  className="p-6 cursor-pointer hover:bg-forest-50/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center flex-shrink-0 text-forest-800">
                      {disease.category === 'healthy' ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                      ) : disease.category === 'pest' ? (
                        <Bug className="w-6 h-6 text-orange-700" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-amber-700" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-forest-700 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded-full">
                          {disease.categoryLabel}
                        </span>
                        {disease.severity !== 'none' && (
                          <span className="text-[10px] font-medium uppercase text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            Severity: {disease.severity}
                          </span>
                        )}
                      </div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-tv-primary">
                        {disease.className}
                      </h2>
                      {disease.scientificName && (
                        <p className="text-xs italic text-tv-secondary font-serif mt-0.5">
                          {disease.scientificName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <Link
                      to="/scan"
                      onClick={(e) => e.stopPropagation()}
                      className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                    >
                      <Scan className="w-3.5 h-3.5" />
                      <span>Scan Leaf</span>
                    </Link>
                    <span className="text-xs font-medium text-forest-800 flex items-center gap-1">
                      {isExpanded ? 'Collapse' : 'Explore'}
                      <ChevronRight
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </span>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-forest-900/8 space-y-6 animate-fade-in bg-white">
                    {/* Summary */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-tv-primary mb-1.5">
                        Overview &amp; Agronomic Impact
                      </h3>
                      <p className="text-sm text-tv-secondary leading-relaxed">
                        {disease.summary}
                      </p>
                    </div>

                    {/* Symptoms & Causes Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Foliar Symptoms */}
                      <div className="bg-surface rounded-xl p-4 border border-forest-900/10">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-tv-primary mb-3 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-forest-700" />
                          Visible Foliage Symptoms
                        </h4>
                        <ul className="space-y-2">
                          {disease.symptoms.map((symptom, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-tv-secondary">
                              <span className="w-1.5 h-1.5 rounded-full bg-forest-700 mt-1.5 flex-shrink-0" />
                              <span>{symptom}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Environmental Triggers & Causes */}
                      <div className="bg-surface rounded-xl p-4 border border-forest-900/10">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-tv-primary mb-3 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                          Primary Environmental Causes
                        </h4>
                        <ul className="space-y-2">
                          {disease.causes.map((cause, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-tv-secondary">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 flex-shrink-0" />
                              <span>{cause}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Preventive & Cultural Practices */}
                    <div className="bg-forest-50/50 rounded-xl p-4 border border-forest-900/10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-forest-950 mb-3 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-forest-700" />
                        Preventive &amp; Cultural Management Practices
                      </h4>
                      <ul className="grid sm:grid-cols-2 gap-2.5">
                        {disease.preventivePractices.map((practice, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-tv-secondary">
                            <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 flex-shrink-0" />
                            <span>{practice}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommended Next Steps */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-tv-primary mb-3">
                        Recommended Field Action Plan
                      </h4>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {disease.recommendedNextSteps.map((step, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg border border-forest-900/10 bg-white"
                          >
                            <span className="text-[11px] font-bold text-forest-700 block mb-1">
                              Step {idx + 1}
                            </span>
                            <p className="text-xs text-tv-secondary">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Scientific Disclaimer */}
                    <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3.5 flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-900 leading-relaxed">
                        <strong className="font-semibold">Agricultural Disclaimer: </strong>
                        {disease.disclaimer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-forest-950 text-forest-200 py-10 mt-16 border-t border-forest-900">
        <div className="section-wrapper flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-forest-400" />
            <span className="font-display font-bold text-white text-sm">TeaVision AI</span>
          </div>
          <p className="text-xs text-forest-300">
            Intelligence for healthier tea plantations. Developed for research &amp; field evaluation.
          </p>
        </div>
      </footer>
    </div>
  );
}
