import type { GUI } from 'lil-gui';
import type { GameConfig, GameSystems } from '../../types/index.js';
import { captureScreenshot } from '../../utils/index.js';

/**
 * Debug visualization toggles panel
 */
export class DebugPanel {
  private config: GameConfig;
  private systems: GameSystems;
  private folder: GUI;

  constructor(gui: GUI, config: GameConfig, systems: GameSystems) {
    this.config = config;
    this.systems = systems;
    this.folder = gui.addFolder('Debug');

    this.setupVisibility();
    this.setupActions();

    this.folder.close();
  }

  private setupVisibility(): void {
    const vis = this.folder.addFolder('Visibility');
    const debug = this.config.debug;

    vis.add(debug, 'SHOW_FOOT_TARGETS')
      .name('Foot Targets')
      .onChange((v: boolean) => {
        if (this.systems.rig && this.systems.scene) {
          this.systems.rig.setDebugVisible(v, this.systems.scene);
        }
      });

    vis.add(debug, 'SHOW_COM_MARKER')
      .name('Center of Mass');

    vis.add(debug, 'SHOW_PLUMB_LINE')
      .name('Plumb Line');

    vis.add(debug, 'SHOW_VELOCITY_ARROW')
      .name('Velocity Arrow');

    vis.add(debug, 'SHOW_SUPPORT_POLYGON')
      .name('Support Polygon');

    vis.add(debug, 'SHOW_COM_TRAIL')
      .name('CoM Trail');

    vis.add(debug, 'SHOW_SKELETON_JOINTS')
      .name('Skeleton Joints');

    vis.add(debug, 'SHOW_GROUND_CONTACT')
      .name('Ground Contact');

    vis.close();
  }

  private setupActions(): void {
    const actions = this.folder.addFolder('Actions');

    actions.add({
      screenshot: () => {
        if (this.systems.sceneManager) {
          const sm = this.systems.sceneManager;
          captureScreenshot(sm.renderer, sm.scene, sm.camera, {
            filename: `stick-figure-${Date.now()}`
          });
        } else {
          console.warn('Screenshot requires sceneManager in systems');
        }
      }
    }, 'screenshot').name('Screenshot');

    actions.add({
      resetPosition: () => {
        if (this.systems.controller) {
          this.systems.controller.position.x = 0;
          this.systems.controller.position.z = 0;
          console.log('Character position reset');
        }
      }
    }, 'resetPosition').name('Reset Position');

    actions.add({
      saveConfig: () => {
        const json = JSON.stringify(this.config, null, 2);
        localStorage.setItem('devToolsConfig', json);
        console.log('Config saved to localStorage');
      }
    }, 'saveConfig').name('Save Config');

    actions.add({
      loadConfig: () => {
        const saved = localStorage.getItem('devToolsConfig');
        if (saved) {
          try {
            const imported = JSON.parse(saved) as Partial<GameConfig>;
            Object.assign(this.config.character, imported.character || {});
            Object.assign(this.config.animation, imported.animation || {});
            Object.assign(this.config.camera, imported.camera || {});
            Object.assign(this.config.terrain, imported.terrain || {});
            Object.assign(this.config.debug, imported.debug || {});
            // Refresh GUI display
            this.folder.controllersRecursive().forEach(c => c.updateDisplay());
            console.log('Config loaded from localStorage');
          } catch (e) {
            console.error('Failed to load config:', e);
          }
        }
      }
    }, 'loadConfig').name('Load Config');

    actions.add({
      exportConfig: () => {
        const json = JSON.stringify(this.config, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'stick-figure-config.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    }, 'exportConfig').name('Export to File');

    actions.close();
  }
}

export default DebugPanel;
