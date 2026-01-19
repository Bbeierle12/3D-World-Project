import GUI from 'lil-gui';
import { CHARACTER, ANIMATION, CAMERA, TERRAIN, DEBUG } from '../config/index.js';
import { TelemetryPanel } from './panels/TelemetryPanel.js';
import { CharacterPanel } from './panels/CharacterPanel.js';
import { AnimationPanel } from './panels/AnimationPanel.js';
import { EnvironmentPanel } from './panels/EnvironmentPanel.js';
import { DebugPanel } from './panels/DebugPanel.js';
import type { GameConfig, GameSystems, TelemetryStats } from '../types/index.js';

interface Panels {
  telemetry?: TelemetryPanel;
  character?: CharacterPanel;
  animation?: AnimationPanel;
  environment?: EnvironmentPanel;
  debug?: DebugPanel;
}

/**
 * Dev tools panel using lil-gui
 * Provides real-time parameter adjustment for development
 */
export class DevTools {
  private systems: GameSystems;
  private gui: GUI | null;
  private panels: Panels;
  private visible: boolean;
  private config: GameConfig;

  constructor(systems: GameSystems) {
    this.systems = systems;
    this.gui = null;
    this.panels = {};
    this.visible = DEBUG.DEV_TOOLS_ENABLED;

    // Live config objects that panels will modify
    this.config = {
      character: { ...CHARACTER },
      animation: { ...ANIMATION },
      camera: { ...CAMERA },
      terrain: { ...TERRAIN },
      debug: { ...DEBUG }
    };

    if (this.visible) {
      this.init();
    }
  }

  private init(): void {
    this.gui = new GUI({
      title: 'Dev Tools',
      width: DEBUG.DEV_TOOLS_WIDTH
    });

    if (DEBUG.DEV_TOOLS_COLLAPSED) {
      this.gui.close();
    }

    this.setupPanels();
    this.setupKeyboardShortcuts();
  }

  private setupPanels(): void {
    if (!this.gui) return;

    // Telemetry first (most frequently viewed)
    this.panels.telemetry = new TelemetryPanel(
      this.gui,
      this.config,
      this.systems
    );

    this.panels.character = new CharacterPanel(
      this.gui,
      this.config,
      this.systems
    );

    this.panels.animation = new AnimationPanel(
      this.gui,
      this.config,
      this.systems
    );

    this.panels.environment = new EnvironmentPanel(
      this.gui,
      this.config,
      this.systems
    );

    this.panels.debug = new DebugPanel(
      this.gui,
      this.config,
      this.systems
    );
  }

  /**
   * Update telemetry display
   */
  updateTelemetry(stats: TelemetryStats): void {
    if (this.panels.telemetry) {
      this.panels.telemetry.update(stats);
    }
  }

  private setupKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // H to toggle dev tools visibility
      if (e.code === 'KeyH' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        this.toggle();
      }
    });
  }

  toggle(): void {
    this.visible = !this.visible;
    if (this.gui) {
      this.gui.domElement.style.display = this.visible ? '' : 'none';
    }
  }

  show(): void {
    this.visible = true;
    if (this.gui) {
      this.gui.domElement.style.display = '';
    }
  }

  hide(): void {
    this.visible = false;
    if (this.gui) {
      this.gui.domElement.style.display = 'none';
    }
  }

  /**
   * Reset all values to defaults
   */
  resetAll(): void {
    Object.assign(this.config.character, CHARACTER);
    Object.assign(this.config.animation, ANIMATION);
    Object.assign(this.config.camera, CAMERA);
    Object.assign(this.config.terrain, TERRAIN);
    Object.assign(this.config.debug, DEBUG);

    // Update all controllers
    if (this.gui) {
      this.gui.controllersRecursive().forEach(c => c.updateDisplay());
    }
  }

  /**
   * Export current config as JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import config from JSON
   */
  importConfig(json: string): void {
    try {
      const imported = JSON.parse(json) as Partial<GameConfig>;
      Object.assign(this.config, imported);
      if (this.gui) {
        this.gui.controllersRecursive().forEach(c => c.updateDisplay());
      }
    } catch (e) {
      console.error('Failed to import config:', e);
    }
  }

  /**
   * Save config to localStorage
   */
  saveToLocalStorage(): void {
    localStorage.setItem('devToolsConfig', this.exportConfig());
    console.log('Config saved to localStorage');
  }

  /**
   * Load config from localStorage
   */
  loadFromLocalStorage(): void {
    const saved = localStorage.getItem('devToolsConfig');
    if (saved) {
      this.importConfig(saved);
      console.log('Config loaded from localStorage');
    }
  }

  dispose(): void {
    if (this.gui) {
      this.gui.destroy();
      this.gui = null;
    }
  }
}

export default DevTools;
