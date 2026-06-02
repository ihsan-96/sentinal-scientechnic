import { Queue } from 'bullmq';
import { count } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import Redis from 'ioredis';
import postgres from 'postgres';
import { INGESTION_QUEUE } from '../ingestion/ingestion.constants';
import { STATS_CACHE_KEY } from '../stats/stats.constants';
import { incidents } from './schema';

async function main() {
  const connection = {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
  };

  // Drain pending ingestion jobs first, so they can't re-populate after the wipe.
  const queue = new Queue(INGESTION_QUEUE, { connection });
  await queue.obliterate({ force: true });
  await queue.close();

  const url = process.env.DATABASE_URL ?? 'postgres://traffic:traffic@localhost:5432/incidents';
  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);
  const [{ total }] = await db.select({ total: count() }).from(incidents);
  await db.delete(incidents);
  await sql.end();

  const redis = new Redis({ ...connection, maxRetriesPerRequest: null });
  await redis.del(STATS_CACHE_KEY);
  await redis.quit();

  console.log(`Cleared ${total} incidents, drained the ingestion queue, and reset the stats cache.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
