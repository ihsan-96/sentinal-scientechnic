// Mock data for the Traffic Incident Dashboard.
// Exposes window.INCIDENT_DATA with a deterministic-ish dataset + helpers.
(function () {
  const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const STATUSES = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'];
  const EVENT_TYPES = ['ACCIDENT', 'CONGESTION', 'ROAD_CLOSURE', 'HAZARD', 'BREAKDOWN'];

  const LOCATIONS = [
    'I-280 N @ Exit 12',
    'US-101 S @ Mile 43',
    'Bay Bridge — Upper Deck',
    'Market St & 5th',
    'I-880 N @ Hegenberger',
    'Hwy 92 @ San Mateo Br',
    'I-580 W @ MacArthur',
    'Geary Blvd & Masonic',
    'I-80 E @ Treasure Is.',
    'Van Ness & Broadway',
    'I-680 S @ Mission Blvd',
    'CA-237 W @ Zanker',
    'Embarcadero & Folsom',
    'I-280 S @ Daly City',
    'US-101 N @ Cesar Chavez',
    'Dumbarton Br — West',
    'I-880 S @ 23rd Ave',
    'Lincoln Hwy & 19th Ave',
    'I-580 E @ Grand Ave',
    'CA-13 N @ Park Blvd',
  ];

  // Seeded PRNG so reloads are stable.
  let seed = 1337;
  function rand() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }
  function pick(arr) {
    return arr[Math.floor(rand() * arr.length)];
  }
  function weightedSeverity() {
    const r = rand();
    if (r < 0.42) return 'LOW';
    if (r < 0.72) return 'MEDIUM';
    if (r < 0.9) return 'HIGH';
    return 'CRITICAL';
  }
  function deviceId() {
    return 'CAM-' + (2000 + Math.floor(rand() * 7000));
  }

  const NOW = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // ---- Incidents (last 7 days, denser in last 24h) ----
  const incidents = [];
  const N = 138;
  for (let i = 0; i < N; i++) {
    // Bias occurredAt toward recent
    const ageFactor = Math.pow(rand(), 1.9); // skew toward 0 (recent)
    const occurred = NOW - ageFactor * 7 * DAY;
    const severity = weightedSeverity();
    const eventType = pick(EVENT_TYPES);

    // Status correlates with age: older -> more likely resolved
    const age = (NOW - occurred) / DAY;
    let status;
    const sr = rand();
    if (age > 2) status = sr < 0.85 ? 'RESOLVED' : pick(['IN_PROGRESS', 'ACKNOWLEDGED']);
    else if (age > 0.5) status = sr < 0.45 ? 'RESOLVED' : pick(['IN_PROGRESS', 'ACKNOWLEDGED', 'OPEN']);
    else status = sr < 0.55 ? 'OPEN' : pick(['ACKNOWLEDGED', 'IN_PROGRESS']);

    // Build event timeline
    const events = [];
    let cursor = occurred;
    events.push({ id: 'e' + i + '-0', status: 'OPEN', occurredAt: new Date(cursor).toISOString() });
    const path = ['ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'];
    const stopAt = path.indexOf(status);
    if (status !== 'OPEN') {
      for (let s = 0; s <= stopAt; s++) {
        cursor += (5 + rand() * 90) * 60 * 1000;
        if (cursor > NOW) cursor = NOW - rand() * 60000;
        events.push({ id: 'e' + i + '-' + (s + 1), status: path[s], occurredAt: new Date(cursor).toISOString() });
      }
    }
    const lastEvent = events[events.length - 1];

    incidents.push({
      id: 'INC-' + String(4821 + i),
      deviceId: deviceId(),
      location: pick(LOCATIONS),
      eventType,
      severity,
      status,
      occurredAt: new Date(occurred).toISOString(),
      lastEventAt: lastEvent.occurredAt,
      createdAt: new Date(occurred).toISOString(),
      updatedAt: lastEvent.occurredAt,
      events,
    });
  }
  incidents.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));

  // ---- Stats ----
  function computeStats(list) {
    const bySeverity = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    const byStatus = { OPEN: 0, ACKNOWLEDGED: 0, IN_PROGRESS: 0, RESOLVED: 0 };
    const byEventType = { ACCIDENT: 0, CONGESTION: 0, ROAD_CLOSURE: 0, HAZARD: 0, BREAKDOWN: 0 };
    list.forEach((i) => {
      bySeverity[i.severity]++;
      byStatus[i.status]++;
      byEventType[i.eventType]++;
    });
    const open = byStatus.OPEN + byStatus.ACKNOWLEDGED + byStatus.IN_PROGRESS;
    return { total: list.length, open, resolved: byStatus.RESOLVED, bySeverity, byStatus, byEventType };
  }

  // ---- Timeseries ----
  // Build hourly buckets over a window; opened/resolved/active + bySeverity.
  function buildTimeseries(rangeMs, buckets) {
    const points = [];
    const step = rangeMs / buckets;
    let active = 6 + Math.floor(rand() * 6);
    for (let b = 0; b < buckets; b++) {
      const t = NOW - rangeMs + b * step;
      const bySeverity = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
      // diurnal-ish opened curve
      const hour = new Date(t).getHours();
      const rush = Math.exp(-Math.pow(hour - 8, 2) / 8) + Math.exp(-Math.pow(hour - 17.5, 2) / 7);
      const base = 1 + rush * 4;
      let opened = Math.max(0, Math.round(base + (rand() - 0.5) * 3));
      for (let o = 0; o < opened; o++) bySeverity[weightedSeverity()]++;
      let resolved = Math.max(0, Math.round(opened * (0.6 + rand() * 0.5) - 0.5));
      active = Math.max(0, active + opened - resolved);
      points.push({
        t: new Date(t).toISOString(),
        opened,
        resolved,
        active,
        bySeverity,
      });
    }
    return points;
  }

  const RANGE_MS = { '15m': 15 * 60000, '1h': 3600000, '6h': 6 * 3600000, '24h': DAY, '7d': 7 * DAY, all: 30 * DAY };
  const RANGE_BUCKETS = { '15m': 15, '1h': 12, '6h': 24, '24h': 24, '7d': 28, all: 30 };

  function getTimeseries(range) {
    return buildTimeseries(RANGE_MS[range] || DAY, RANGE_BUCKETS[range] || 24);
  }

  function getStats(range) {
    const cutoff = NOW - (RANGE_MS[range] || DAY);
    const list = range === 'all' ? incidents : incidents.filter((i) => new Date(i.occurredAt).getTime() >= cutoff);
    return computeStats(list);
  }

  function getIncidents(range) {
    const cutoff = NOW - (RANGE_MS[range] || DAY);
    return range === 'all' ? incidents : incidents.filter((i) => new Date(i.occurredAt).getTime() >= cutoff);
  }

  window.INCIDENT_DATA = {
    SEVERITIES,
    STATUSES,
    EVENT_TYPES,
    LOCATIONS,
    incidents,
    getStats,
    getTimeseries,
    getIncidents,
    computeStats,
    NOW,
    rand,
  };
})();
