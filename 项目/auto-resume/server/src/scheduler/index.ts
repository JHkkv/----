import { EventEmitter } from 'events';

export interface SchedulerConfig {
  dailyLimit: number;
  minDelayMs: number;
  maxDelayMs: number;
  workdayOnly: boolean;
  workHoursStart: number;
  workHoursEnd: number;
}

type TaskFn = () => Promise<void>;

export class Scheduler extends EventEmitter {
  private queue: TaskFn[] = [];
  private running = false;
  private _todaySent = 0;
  private config: SchedulerConfig;

  constructor(config: SchedulerConfig) {
    super();
    this.config = config;
    this.on('error', () => { /* default noop: caller should attach their own handler */ });
  }

  get todaySent(): number {
    return this._todaySent;
  }

  enqueue(task: TaskFn): void {
    this.queue.push(task);
    if (!this.running) {
      this.run();
    }
  }

  stop(): void {
    this.running = false;
    this.queue = [];
  }

  async waitForDrain(timeoutMs: number): Promise<void> {
    const start = Date.now();
    while (this.queue.length > 0 && Date.now() - start < timeoutMs) {
      await new Promise(r => setTimeout(r, 50));
    }
    while (this.running && Date.now() - start < timeoutMs) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  private async run(): Promise<void> {
    this.running = true;
    while (this.queue.length > 0 && this.running) {
      if (!this.canRunNow()) {
        await this.delay(60000);
        continue;
      }

      if (this._todaySent >= this.config.dailyLimit) {
        this.emit('limit', { type: 'limit', reason: 'Daily limit reached' });
        break;
      }

      const task = this.queue.shift()!;
      const delayMs = this.randomDelay();
      await this.delay(delayMs);

      try {
        await task();
        this._todaySent++;
        this.emit('progress', {
          type: 'progress',
          sent: this._todaySent,
          remaining: this.queue.length,
        });
      } catch (err) {
        this.emit('error', {
          type: 'error',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    this.running = false;
  }

  private canRunNow(): boolean {
    if (!this.config.workdayOnly) return true;
    const now = new Date();
    const day = now.getDay();
    if (day === 0 || day === 6) return false;
    const hour = now.getHours();
    return hour >= this.config.workHoursStart && hour < this.config.workHoursEnd;
  }

  private randomDelay(): number {
    const { minDelayMs, maxDelayMs } = this.config;
    return Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
