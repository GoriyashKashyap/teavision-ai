import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf,
  Scan,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  BookOpen,
  History,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { getAnalyticsSummary } from '../services/api';
import type { AnalyticsSummary } from '../types';
import { DISEASE_CLASSES } from '../lib/constants';

const PIE_COLORS = ['#10B981', '#F59E0B'];

export default function DashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAnalyticsSummary();
        setSummary(data);
      } catch (err) {
        console.error('Failed to load analytics summary:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-forest-700 animate-spin mb-3" />
        <p className="text-sm text-tv-secondary font-medium">Loading research analytics…</p>
      </div>
    );
  }

  const total = summary?.total_predictions ?? 0;
  const healthy = summary?.healthy_count ?? 0;
  const disease = summary?.disease_count ?? 0;
  const avgLatency = summary?.average_latency_ms ?? 0;
  const obsCount = summary?.field_observations_count ?? 0;

  // Chart data for class distribution
  const barData = DISEASE_CLASSES.map((cls) => ({
    name: cls,
    shortName: cls.length > 13 ? `${cls.slice(0, 11)}…` : cls,
    count: summary?.distribution[cls] ?? 0,
  }));

  const pieData = [
    { name: 'Healthy Foliage', value: healthy },
    { name: 'Diseased / Pest Damage', value: disease },
  ];

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
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
                to="/history"
                className="text-xs sm:text-sm font-medium text-tv-secondary hover:text-tv-primary flex items-center gap-1 transition-colors"
              >
                <History className="w-4 h-4 text-forest-700" />
                <span className="hidden sm:inline">History</span>
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

      {/* Main Container */}
      <div className="section-wrapper py-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-tv-primary mb-1">
            Research &amp; Field Intelligence Dashboard
          </h1>
          <p className="text-sm text-tv-secondary">
            Aggregated inference metrics, classification distributions, and field evaluation telemetry.
          </p>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <div className="card p-4">
            <span className="text-xs font-medium text-tv-secondary block mb-1">Total Predictions</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-tv-primary font-mono">{total}</span>
              <TrendingUp className="w-4 h-4 text-forest-700" />
            </div>
          </div>

          <div className="card p-4">
            <span className="text-xs font-medium text-tv-secondary block mb-1">Healthy Foliage</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-700 font-mono">{healthy}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[11px] text-tv-secondary">
              {total > 0 ? `${((healthy / total) * 100).toFixed(0)}% of total` : '0%'}
            </span>
          </div>

          <div className="card p-4">
            <span className="text-xs font-medium text-tv-secondary block mb-1">Disease / Pest</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-amber-700 font-mono">{disease}</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-[11px] text-tv-secondary">
              {total > 0 ? `${((disease / total) * 100).toFixed(0)}% of total` : '0%'}
            </span>
          </div>

          <div className="card p-4">
            <span className="text-xs font-medium text-tv-secondary block mb-1">Avg Latency (CPU)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold text-tv-primary font-mono">{avgLatency}</span>
              <span className="text-xs text-tv-secondary">ms</span>
            </div>
            <span className="text-[11px] text-tv-secondary">TorchScript PyTorch</span>
          </div>

          <div className="card p-4 col-span-2 md:col-span-1">
            <span className="text-xs font-medium text-tv-secondary block mb-1">Field Observations</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-forest-800 font-mono">{obsCount}</span>
              <MapPin className="w-4 h-4 text-forest-700" />
            </div>
            <span className="text-[11px] text-tv-secondary">Estate field logs</span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Class Frequency Bar Chart (2 cols) */}
          <div className="card p-6 md:col-span-2">
            <h3 className="font-display font-semibold text-base text-tv-primary mb-1">
              Prediction Distribution by Class
            </h3>
            <p className="text-xs text-tv-secondary mb-4">
              Frequency of model inferences across the 7 trained categories.
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#647067' }} />
                  <YAxis type="category" dataKey="shortName" width={110} tick={{ fontSize: 11, fill: '#17251C' }} />
                  <Tooltip
                    formatter={(val: any) => [val, 'Scans']}
                    labelFormatter={(_label, payload) => {
                      if (payload && payload[0]) return payload[0].payload.name;
                      return _label;
                    }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                  <Bar dataKey="count" fill="#14532D" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.name === 'Healthy leaf' ? '#10B981' : '#14532D'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Healthy vs Disease Ratio Pie Chart (1 col) */}
          <div className="card p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-semibold text-base text-tv-primary mb-1">
                Healthy vs. Diseased Ratio
              </h3>
              <p className="text-xs text-tv-secondary mb-2">
                Comparative breakdown of submitted samples.
              </p>
            </div>

            <div className="h-48 w-full flex items-center justify-center">
              {total === 0 ? (
                <p className="text-xs text-tv-secondary">No predictions recorded yet</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {pieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [val, 'Scans']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-forest-900/10 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-tv-secondary">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Healthy Foliage
                </span>
                <span className="font-bold text-tv-primary">{healthy}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-tv-secondary">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Diseased / Pest
                </span>
                <span className="font-bold text-tv-primary">{disease}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scientific Research Disclaimer Alert */}
        <div className="bg-surface border border-forest-900/10 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-forest-700 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-tv-secondary leading-relaxed">
            <strong className="text-tv-primary">Scientific Note: </strong>
            These dashboard analytics represent user-submitted leaf photographs processed by the LightTeaNet-ECA model.
            They reflect application usage telemetry and must not be interpreted as biological disease prevalence or plantation epidemiology across estates.
          </p>
        </div>
      </div>
    </div>
  );
}
