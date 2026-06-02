export const RANGES = ['15m', '1h', '6h', '24h', '7d', 'all'] as const;
export type Range = (typeof RANGES)[number];

export const RANGE_LABELS: Record<Range, string> = {
  '15m': '15 min',
  '1h': '1 hour',
  '6h': '6 hours',
  '24h': '24 hours',
  '7d': '7 days',
  all: 'All',
};

const OFFSET_MS: Record<Range, number | undefined> = {
  '15m': 15 * 60_000,
  '1h': 60 * 60_000,
  '6h': 6 * 60 * 60_000,
  '24h': 24 * 60 * 60_000,
  '7d': 7 * 24 * 60 * 60_000,
  all: undefined,
};

const BUCKET: Record<Range, string> = {
  '15m': 'minute',
  '1h': 'fiveMinutes',
  '6h': 'fifteenMinutes',
  '24h': 'hour',
  '7d': 'sixHours',
  all: 'day',
};

export interface Window {
  from?: string;
  to: string;
  bucket: string;
}

/** Resolved at call time so refetches always extend to "now" without churning query keys. */
export function rangeToWindow(range: Range): Window {
  const now = Date.now();
  const offset = OFFSET_MS[range];
  return {
    from: offset ? new Date(now - offset).toISOString() : undefined,
    to: new Date(now).toISOString(),
    bucket: BUCKET[range],
  };
}
