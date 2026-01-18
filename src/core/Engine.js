/**
 * Game engine - owns the update loop
 * Manages timing and calls update/render on systems
 */
export class Engine {
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
   * @param {object} system - Must have update(deltaTime, elapsedTime) method
   */
  addSystem(system) {
    this.systems.push(system);
  }

  /**
   * Remove a system
   * @param {object} system
   */
  removeSystem(system) {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      this.systems.splice(index, 1);
    }
  }

  /**
   * Set render callback
   * @param {function} callback
   */
  setRenderCallback(callback) {
    this.renderCallback = callback;
  }

  /**
   * Start the engine
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.loop);
  }

  /**
   * Stop the engine
   */
  stop() {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Pause updates (rendering continues)
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume from pause
   */
  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.lastTime = performance.now();
    }
  }

  /**
   * Main loop
   * @param {number} currentTime
   */
  loop(currentTime) {
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
   * @returns {{deltaTime: number, elapsedTime: number}}
   */
  getTiming() {
    return {
      deltaTime: this.deltaTime,
      elapsedTime: this.elapsedTime
    };
  }
}

export default Engine;
