import { randomIncident } from './incident-factory';

interface Options {
  count: number;
  batch: number;
  rate: number;
  url: string;
}

function parseArgs(): Options {
  const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [key, value] = arg.replace(/^--/, '').split('=');
      return [key, value];
    }),
  );
  return {
    count: Number(args.count ?? 1000),
    batch: Number(args.batch ?? 100),
    rate: Number(args.rate ?? 0),
    url: args.url ?? 'http://localhost:4000/api',
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function post(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
}

async function main() {
  const { count, batch, rate, url } = parseArgs();
  const delay = rate > 0 ? (batch / rate) * 1000 : 0;
  let sent = 0;

  while (sent < count) {
    const size = Math.min(batch, count - sent);
    const incidents = Array.from({ length: size }, randomIncident);
    await post(`${url}/incidents/batch`, { incidents });
    sent += size;
    process.stdout.write(`\rQueued ${sent}/${count}`);
    if (delay) await sleep(delay);
  }

  process.stdout.write(`\nDone. Queued ${sent} incidents.\n`);
}

main().catch((err) => {
  console.error('\nSimulation failed:', err.message);
  process.exit(1);
});
