import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { DISEASE_CLASSES } from '../../lib/constants';

interface Props {
  probabilities: number[];
  predictedClass: string;
}

export default function ProbabilityChart({ probabilities, predictedClass }: Props) {
  const data = DISEASE_CLASSES.map((name, index) => {
    const rawVal = probabilities[index] ?? 0;
    const percentage = Number((rawVal * 100).toFixed(1));
    const isSelected = name === predictedClass;

    return {
      name,
      shortName: name.length > 14 ? `${name.slice(0, 12)}…` : name,
      percentage,
      rawVal,
      isSelected,
    };
  });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display font-semibold text-sm text-tv-primary">
          Class Probability Distribution
        </h4>
        <span className="text-xs text-tv-secondary font-mono">Softmax (N=7)</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#647067' }}
              unit="%"
            />
            <YAxis
              type="category"
              dataKey="shortName"
              width={100}
              tick={{ fontSize: 11, fill: '#17251C' }}
            />
            <Tooltip
              formatter={(value: any) => [`${value}%`, 'Confidence']}
              labelFormatter={(_label, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.name;
                }
                return _label;
              }}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '0.75rem',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
              {data.map((entry) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={entry.isSelected ? '#14532D' : '#94A3B8'}
                  opacity={entry.isSelected ? 1 : 0.65}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-tv-secondary mt-2 text-center">
        Bars indicate the mathematical probability output by LightTeaNet-ECA across all 7 trained categories.
      </p>
    </div>
  );
}
