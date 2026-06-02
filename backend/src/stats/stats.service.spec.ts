import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from '../cache/redis-cache.service';
import { Database } from '../db/db.module';
import { IncidentStats, StatsService } from './stats.service';

const emptyStats: IncidentStats = {
  total: 0,
  open: 0,
  resolved: 0,
  bySeverity: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
  byStatus: { OPEN: 0, ACKNOWLEDGED: 0, IN_PROGRESS: 0, RESOLVED: 0 },
  byEventType: { ACCIDENT: 0, CONGESTION: 0, ROAD_CLOSURE: 0, HAZARD: 0, BREAKDOWN: 0 },
};

describe('StatsService', () => {
  let cache: jest.Mocked<RedisCacheService>;
  let db: { select: jest.Mock };
  let service: StatsService;

  beforeEach(() => {
    cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() } as unknown as jest.Mocked<RedisCacheService>;
    db = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({ groupBy: jest.fn().mockResolvedValue([]) }),
        }),
      }),
    };
    const config = { getOrThrow: jest.fn().mockReturnValue(10) } as unknown as ConfigService;
    service = new StatsService(db as unknown as Database, cache, config);
  });

  it('returns the cached global summary without querying the database', async () => {
    cache.get.mockResolvedValue({ ...emptyStats, total: 42 });

    const result = await service.getSummary({});

    expect(result.total).toBe(42);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('computes and caches the global summary on a cache miss', async () => {
    cache.get.mockResolvedValue(null);

    const result = await service.getSummary({});

    expect(result).toEqual(emptyStats);
    expect(cache.set).toHaveBeenCalledWith('stats:summary', emptyStats, 10);
  });

  it('computes a windowed summary live, bypassing the cache', async () => {
    const result = await service.getSummary({ from: '2026-06-01T00:00:00Z' });

    expect(result).toEqual(emptyStats);
    expect(cache.get).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('invalidates the cached summary', async () => {
    await service.invalidate();

    expect(cache.del).toHaveBeenCalledWith('stats:summary');
  });
});
