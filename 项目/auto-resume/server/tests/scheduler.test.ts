import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Scheduler } from '../src/scheduler';

describe('Scheduler', () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    scheduler = new Scheduler({
      dailyLimit: 3,
      minDelayMs: 10,
      maxDelayMs: 50,
      workdayOnly: false,
      workHoursStart: 0,
      workHoursEnd: 24,
    });
  });

  afterEach(() => {
    scheduler.stop();
  });

  it('processes tasks one at a time', async () => {
    const results: number[] = [];
    const task = (id: number) => async () => {
      results.push(id);
    };

    scheduler.enqueue(task(1));
    scheduler.enqueue(task(2));
    scheduler.enqueue(task(3));

    await scheduler.waitForDrain(1000);
    expect(results).toEqual([1, 2, 3]);
  });

  it('respects daily limit', async () => {
    let count = 0;
    for (let i = 0; i < 5; i++) {
      scheduler.enqueue(async () => { count++; });
    }
    await scheduler.waitForDrain(1000);
    expect(count).toBe(3); // dailyLimit = 3
  });

  it('tracks sent count', async () => {
    scheduler.enqueue(async () => {});
    scheduler.enqueue(async () => {});
    await scheduler.waitForDrain(1000);
    expect(scheduler.todaySent).toBe(2);
  });

  it('emits progress events', async () => {
    const events: any[] = [];
    scheduler.on('progress', (e) => events.push(e));

    scheduler.enqueue(async () => {});
    await scheduler.waitForDrain(1000);

    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].type).toBe('progress');
  });
});
