import { Range, RANGES } from '../lib/timeRange';

interface Props {
  value: Range;
  onChange: (range: Range) => void;
}

const SHORT_LABELS: Record<Range, string> = {
  '15m': '15M',
  '1h': '1H',
  '6h': '6H',
  '24h': '24H',
  '7d': '7D',
  all: 'ALL',
};

export function TimeRangeControl({ value, onChange }: Props) {
  return (
    <div className="seg">
      {RANGES.map((range) => (
        <button key={range} className={value === range ? 'on' : ''} onClick={() => onChange(range)}>
          {SHORT_LABELS[range]}
        </button>
      ))}
    </div>
  );
}
