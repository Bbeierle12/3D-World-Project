import type { LoggingConfig } from '../types/index.js';

// Logging parameters
export const LOGGING: LoggingConfig = {
  ENABLED: true,
  MAX_ENTRIES: 500,
  MIN_LEVEL: 'debug',
  CATEGORIES: {
    system: true,
    input: true,
    physics: true,
    animation: true,
    camera: true,
    ui: true,
    telemetry: true,
    render: true
  }
};

export default LOGGING;
