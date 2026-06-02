import { Range, RANGES, RANGE_LABELS } from '../lib/timeRange';

interface Props {
  value: Range;
  onChange: (range: Range) => void;
}

export function TimeRangeControl({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1">
      {RANGES.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={`rounded-md px-3 py-1.5 text-sm ${
            value === range
              ? 'bg-slate-900 text-white'
              : 'border border-slate-200 bg-white text-slate-700'
          }`}
        >
          {RANGE_LABELS[range]}
        </button>
      ))}
    </div>
  );
}
