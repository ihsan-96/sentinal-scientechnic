import { useCallback, useEffect, useRef, useState } from 'react';
import { openBatch, sendStatusEvent } from '../api';
import { buildOpen, lifecycleSteps } from '../lib/generator';
import { Overrides } from '../types';

export type Mode = 'oneshot' | 'continuous';

export interface RunConfig {
  apiUrl: string;
  mode: Mode;
  count: number;
  batchSize: number;
  rate: number; // incidents/sec for one-shot (0 = as fast as possible)
  interval: number; // seconds between batches for continuous
  progressPct: number; // share of opened cases advanced through their lifecycle
  outOfOrder: boolean; // send a case's status events in shuffled arrival order
  overrides: Overrides;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function useSimulator() {
  const [running, setRunning] = useState(false);
  const [opened, setOpened] = useState(0);
  const [updates, setUpdates] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const runBatch = useCallback(async (config: RunConfig, size: number) => {
    const opens = Array.from({ length: size }, () => buildOpen(config.overrides));
    await openBatch(config.apiUrl, opens);
    setOpened((n) => n + size);

    const toProgress = opens.filter(() => Math.random() * 100 < config.progressPct);
    if (toProgress.length === 0) return;

    await sleep(400); // let the async opens commit before their status events arrive
    let sent = 0;
    await Promise.all(
      toProgress.map(async (open) => {
        const steps = config.outOfOrder ? shuffle(lifecycleSteps()) : lifecycleSteps();
        for (const step of steps) {
          await sendStatusEvent(config.apiUrl, open.id, step.status, step.timestamp);
          sent++;
        }
      }),
    );
    setUpdates((n) => n + sent);
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRunning(false);
  }, []);

  const start = useCallback(
    async (config: RunConfig) => {
      if (runningRef.current) return;
      setError(null);
      setOpened(0);
      setUpdates(0);
      setStartedAt(Date.now());
      runningRef.current = true;
      setRunning(true);

      try {
        if (config.mode === 'continuous') {
          const tick = () =>
            runBatch(config, config.batchSize).catch((e) => {
              setError((e as Error).message);
              stop();
            });
          await tick();
          timerRef.current = window.setInterval(tick, Math.max(0.2, config.interval) * 1000);
        } else {
          const delay = config.rate > 0 ? (config.batchSize / config.rate) * 1000 : 0;
          let remaining = config.count;
          while (remaining > 0 && runningRef.current) {
            const size = Math.min(config.batchSize, remaining);
            await runBatch(config, size);
            remaining -= size;
            if (delay && remaining > 0) await sleep(delay);
          }
          stop();
        }
      } catch (e) {
        setError((e as Error).message);
        stop();
      }
    },
    [runBatch, stop],
  );

  useEffect(() => () => stop(), [stop]);

  return { running, opened, updates, startedAt, error, start, stop };
}
