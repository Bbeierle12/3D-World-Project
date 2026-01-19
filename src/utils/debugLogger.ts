import { LOGGING } from '../config/index.js';
import type { LogCategory, LogLevel, LoggingConfig } from '../types/index.js';

export interface LogEntry {
  id: number;
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: unknown;
}

export interface LoggerSettings {
  enabled: boolean;
  maxEntries: number;
  minLevel: LogLevel;
  categories: Record<LogCategory, boolean>;
}

export type LogListener = (entries: LogEntry[], settings: LoggerSettings) => void;

export const LOG_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];
export const LOG_CATEGORIES: LogCategory[] = [
  'system',
  'input',
  'physics',
  'animation',
  'camera',
  'ui',
  'telemetry',
  'render'
];

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

export class DebugLogger {
  enabled: boolean;
  maxEntries: number;
  minLevel: LogLevel;
  categories: Record<LogCategory, boolean>;
  entries: LogEntry[];
  listeners: Set<LogListener>;
  nextId: number;
  notifyPending: boolean;

  constructor(config: LoggingConfig) {
    this.enabled = config.ENABLED;
    this.maxEntries = Math.max(1, Math.floor(config.MAX_ENTRIES));
    this.minLevel = config.MIN_LEVEL;
    this.categories = { ...config.CATEGORIES };
    this.entries = [];
    this.listeners = new Set();
    this.nextId = 0;
    this.notifyPending = false;
  }

  log(category: LogCategory, level: LogLevel, message: string, data?: unknown): void {
    if (!this.enabled) return;
    if (!this.categories[category]) return;
    if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[this.minLevel]) return;

    this.entries.push({
      id: this.nextId++,
      timestamp: Date.now(),
      level,
      category,
      message,
      data
    });

    if (this.entries.length > this.maxEntries) {
      this.entries.splice(0, this.entries.length - this.maxEntries);
    }

    this.notify();
  }

  getEntries(): LogEntry[] {
    return this.entries.slice();
  }

  getSettings(): LoggerSettings {
    return {
      enabled: this.enabled,
      maxEntries: this.maxEntries,
      minLevel: this.minLevel,
      categories: { ...this.categories }
    };
  }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    this.notify();
  }

  setMinLevel(level: LogLevel): void {
    if (this.minLevel === level) return;
    this.minLevel = level;
    this.notify();
  }

  setMaxEntries(maxEntries: number): void {
    const nextMax = Math.max(1, Math.floor(maxEntries));
    if (this.maxEntries === nextMax) return;
    this.maxEntries = nextMax;
    if (this.entries.length > this.maxEntries) {
      this.entries.splice(0, this.entries.length - this.maxEntries);
    }
    this.notify();
  }

  setCategoryEnabled(category: LogCategory, enabled: boolean): void {
    if (this.categories[category] === enabled) return;
    this.categories[category] = enabled;
    this.notify();
  }

  clear(): void {
    if (this.entries.length === 0) return;
    this.entries = [];
    this.notify();
  }

  exportJSON(): string {
    return JSON.stringify(
      {
        settings: this.getSettings(),
        entries: this.entries
      },
      null,
      2
    );
  }

  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener(this.getEntries(), this.getSettings());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    if (this.notifyPending) return;
    this.notifyPending = true;

    const flush = () => {
      this.notifyPending = false;
      const snapshot = this.getEntries();
      const settings = this.getSettings();
      this.listeners.forEach((listener) => listener(snapshot, settings));
    };

    if (typeof queueMicrotask === 'function') {
      queueMicrotask(flush);
    } else {
      setTimeout(flush, 0);
    }
  }
}

export const debugLogger = new DebugLogger(LOGGING);

export default debugLogger;
