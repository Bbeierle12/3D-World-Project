/**
 * Interface for systems that can be updated by the engine
 */
export interface Updateable {
  update(deltaTime: number, elapsedTime: number): void;
}

/**
 * Game engine - owns the update loop
 * Manages timing and calls update/render on systems
 */
export class Engine {
  systems: Updateable[];
  renderCallback: (() => void) | null;

  isRunning: boolean;
  isPaused: boolean;
  animationId: number | null;

  // Timing
  lastTime: number;
  elapsedTime: number;
  deltaTime: number;
  maxDeltaTime: number;

  constructor() {
    this.systems = [];
    this.renderCallback = null;

    this.isRunning = false;
    this.isPaused = false;
    this.animationId = null;

    // Timing
    this.lastTime = 0;
    this.elapsedTime = 0;
    this.deltaTime = 0;
    this.maxDeltaTime = 0.1; // Cap to prevent spiral of death

    // Bind loop
    this.loop = this.loop.bind(this);
  }

  /**
   * Register a system to receive updates
   */
  addSystem(system: Updateable): void {
    this.systems.push(system);
  }

  /**
   * Remove a system
   */
  removeSystem(system: Updateable): void {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      this.systems.splice(index, 1);
    }
  }

  /**
   * Set render callback
   */
  setRenderCallback(callback: () => void): void {
    this.renderCallback = callback;
  }

  /**
   * Start the engine
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.loop);
  }

  /**
   * Stop the engine
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Pause updates (rendering continues)
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume from pause
   */
  resume(): void {
    if (this.isPaused) {
      this.isPaused = false;
      this.lastTime = performance.now();
    }
  }

  /**
   * Main loop
   */
  loop(currentTime: number): void {
    if (!this.isRunning) return;

    // Request next frame first
    this.animationId = requestAnimationFrame(this.loop);

    // Calculate delta time
    this.deltaTime = Math.min(
      (currentTime - this.lastTime) / 1000,
      this.maxDeltaTime
    );
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.elapsedTime += this.deltaTime;

      // Update all systems
      for (const system of this.systems) {
        if (system.update) {
          system.update(this.deltaTime, this.elapsedTime);
        }
      }
    }

    // Always render
    if (this.renderCallback) {
      this.renderCallback();
    }
  }

  /**
   * Get current timing info
   */
  getTiming(): { deltaTime: number; elapsedTime: number } {
    return {
      deltaTime: this.deltaTime,
      elapsedTime: this.elapsedTime
    };
  }
}

export default Engine;
