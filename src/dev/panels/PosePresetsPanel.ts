import type { GUI } from 'lil-gui';
import type { GameConfig, GameSystems, PosePreset } from '../../types/index.js';

const STORAGE_KEY = 'stickFigurePosePresets';

/**
 * Built-in pose presets
 */
const BUILT_IN_PRESETS: PosePreset[] = [
  {
    name: 'T-Pose',
    description: 'Standard T-pose with arms extended',
    jointAngles: {
      spine: { x: 0, y: 0, z: 0 },
      neck: { x: 0, y: 0, z: 0 },
      leftUpperArm: { x: 0, y: 0, z: Math.PI / 2 },
      rightUpperArm: { x: 0, y: 0, z: -Math.PI / 2 },
      leftLowerArm: { x: 0, y: 0, z: 0 },
      rightLowerArm: { x: 0, y: 0, z: 0 },
      leftUpperLeg: { x: 0, y: 0, z: 0 },
      rightUpperLeg: { x: 0, y: 0, z: 0 },
      leftLowerLeg: { x: 0, y: 0, z: 0 },
      rightLowerLeg: { x: 0, y: 0, z: 0 },
      root: { x: 0, y: 0, z: 0 }
    }
  },
  {
    name: 'Single-Leg (Left)',
    description: 'Balanced on left leg',
    jointAngles: {
      spine: { x: 0, y: 0, z: 0 },
      neck: { x: 0, y: 0, z: 0 },
      leftUpperArm: { x: 0.2, y: 0, z: 0.5 },
      rightUpperArm: { x: 0.2, y: 0, z: -0.5 },
      leftLowerArm: { x: -0.3, y: 0, z: 0 },
      rightLowerArm: { x: -0.3, y: 0, z: 0 },
      leftUpperLeg: { x: 0, y: 0, z: 0 },
      rightUpperLeg: { x: 0.8, y: 0, z: 0 },
      leftLowerLeg: { x: 0, y: 0, z: 0 },
      rightLowerLeg: { x: 0.5, y: 0, z: 0 },
      root: { x: 0, y: 0, z: 0.05 }
    }
  },
  {
    name: 'Single-Leg (Right)',
    description: 'Balanced on right leg',
    jointAngles: {
      spine: { x: 0, y: 0, z: 0 },
      neck: { x: 0, y: 0, z: 0 },
      leftUpperArm: { x: 0.2, y: 0, z: 0.5 },
      rightUpperArm: { x: 0.2, y: 0, z: -0.5 },
      leftLowerArm: { x: -0.3, y: 0, z: 0 },
      rightLowerArm: { x: -0.3, y: 0, z: 0 },
      leftUpperLeg: { x: 0.8, y: 0, z: 0 },
      rightUpperLeg: { x: 0, y: 0, z: 0 },
      leftLowerLeg: { x: 0.5, y: 0, z: 0 },
      rightLowerLeg: { x: 0, y: 0, z: 0 },
      root: { x: 0, y: 0, z: -0.05 }
    }
  },
  {
    name: 'Mid-Stride',
    description: 'Walking mid-stride pose',
    jointAngles: {
      spine: { x: 0.1, y: 0.1, z: 0 },
      neck: { x: -0.05, y: 0, z: 0 },
      leftUpperArm: { x: -0.4, y: 0, z: 0 },
      rightUpperArm: { x: 0.4, y: 0, z: 0 },
      leftLowerArm: { x: -0.5, y: 0, z: 0 },
      rightLowerArm: { x: -0.5, y: 0, z: 0 },
      leftUpperLeg: { x: -0.4, y: 0, z: 0 },
      rightUpperLeg: { x: 0.5, y: 0, z: 0 },
      leftLowerLeg: { x: 0.3, y: 0, z: 0 },
      rightLowerLeg: { x: 0.7, y: 0, z: 0 },
      root: { x: 0, y: 0, z: 0 }
    }
  },
  {
    name: 'Crouch',
    description: 'Crouching pose',
    jointAngles: {
      spine: { x: 0.3, y: 0, z: 0 },
      neck: { x: -0.2, y: 0, z: 0 },
      leftUpperArm: { x: 0.4, y: 0, z: 0.3 },
      rightUpperArm: { x: 0.4, y: 0, z: -0.3 },
      leftLowerArm: { x: -0.8, y: 0, z: 0 },
      rightLowerArm: { x: -0.8, y: 0, z: 0 },
      leftUpperLeg: { x: 1.2, y: 0, z: 0 },
      rightUpperLeg: { x: 1.2, y: 0, z: 0 },
      leftLowerLeg: { x: 2.0, y: 0, z: 0 },
      rightLowerLeg: { x: 2.0, y: 0, z: 0 },
      root: { x: 0, y: 0, z: 0 }
    }
  },
  {
    name: 'Jump',
    description: 'Mid-jump pose',
    jointAngles: {
      spine: { x: -0.1, y: 0, z: 0 },
      neck: { x: 0.1, y: 0, z: 0 },
      leftUpperArm: { x: -0.5, y: 0, z: 0.8 },
      rightUpperArm: { x: -0.5, y: 0, z: -0.8 },
      leftLowerArm: { x: -0.3, y: 0, z: 0 },
      rightLowerArm: { x: -0.3, y: 0, z: 0 },
      leftUpperLeg: { x: 0.4, y: 0, z: 0 },
      rightUpperLeg: { x: 0.4, y: 0, z: 0 },
      leftLowerLeg: { x: 0.6, y: 0, z: 0 },
      rightLowerLeg: { x: 0.6, y: 0, z: 0 },
      root: { x: 0, y: 0, z: 0 }
    }
  }
];

/**
 * Panel for managing pose presets
 */
export class PosePresetsPanel {
  private config: GameConfig;
  private systems: GameSystems;
  private folder: GUI;
  private presetSelect: { preset: string };
  private customPresets: PosePreset[];

  constructor(gui: GUI, config: GameConfig, systems: GameSystems) {
    this.config = config;
    this.systems = systems;
    this.folder = gui.addFolder('Pose Presets');
    this.presetSelect = { preset: 'T-Pose' };
    this.customPresets = this.loadCustomPresets();

    // Suppress unused warnings
    void this.config;
    void this.systems;

    this.setupControls();
    this.folder.close();
  }

  private setupControls(): void {
    // Preset selector
    const allPresets = this.getAllPresetNames();
    this.folder.add(this.presetSelect, 'preset', allPresets)
      .name('Select Preset')
      .onChange(() => {});

    // Apply preset button
    this.folder.add({
      apply: () => {
        this.applyPreset(this.presetSelect.preset);
      }
    }, 'apply').name('Apply Preset');

    // Built-in presets section
    const builtIn = this.folder.addFolder('Built-in');
    for (const preset of BUILT_IN_PRESETS) {
      builtIn.add({
        apply: () => this.applyPreset(preset.name)
      }, 'apply').name(preset.name);
    }
    builtIn.close();

    // Custom presets section
    const custom = this.folder.addFolder('Custom');

    custom.add({
      saveCurrent: () => {
        const name = prompt('Enter preset name:');
        if (name && name.trim()) {
          this.saveCurrentPose(name.trim());
        }
      }
    }, 'saveCurrent').name('Save Current Pose');

    custom.add({
      exportPresets: () => {
        this.exportPresets();
      }
    }, 'exportPresets').name('Export Presets');

    custom.add({
      importPresets: () => {
        this.importPresets();
      }
    }, 'importPresets').name('Import Presets');

    custom.add({
      clearCustom: () => {
        if (confirm('Delete all custom presets?')) {
          this.clearCustomPresets();
        }
      }
    }, 'clearCustom').name('Clear Custom');

    custom.close();
  }

  /**
   * Get all preset names (built-in + custom)
   */
  private getAllPresetNames(): string[] {
    const builtInNames = BUILT_IN_PRESETS.map(p => p.name);
    const customNames = this.customPresets.map(p => `[Custom] ${p.name}`);
    return [...builtInNames, ...customNames];
  }

  /**
   * Find preset by name
   */
  private findPreset(name: string): PosePreset | undefined {
    // Check built-in first
    const builtIn = BUILT_IN_PRESETS.find(p => p.name === name);
    if (builtIn) return builtIn;

    // Check custom (remove [Custom] prefix)
    const customName = name.replace('[Custom] ', '');
    return this.customPresets.find(p => p.name === customName);
  }

  /**
   * Apply a pose preset to the rig
   */
  applyPreset(name: string): void {
    const preset = this.findPreset(name);
    if (!preset) {
      console.warn(`Preset not found: ${name}`);
      return;
    }

    // Note: Actual application requires access to the rig's pivot rotations
    // This is a placeholder that logs the intent
    console.log(`Applying pose preset: ${preset.name}`);
    console.log('Joint angles:', preset.jointAngles);

    // In a full implementation, you would access systems.rig and set pivot rotations
    // For example:
    // const rig = this.systems.rig as any;
    // if (rig && rig.pivots) {
    //   for (const [joint, angles] of Object.entries(preset.jointAngles)) {
    //     if (rig.pivots[joint]) {
    //       rig.pivots[joint].rotation.x = angles.x;
    //       rig.pivots[joint].rotation.y = angles.y;
    //       rig.pivots[joint].rotation.z = angles.z;
    //     }
    //   }
    // }
  }

  /**
   * Save current pose as a preset
   */
  saveCurrentPose(name: string): void {
    // Create preset from current rig state
    // This is a placeholder - actual implementation needs rig access
    const preset: PosePreset = {
      name,
      description: `Custom pose saved at ${new Date().toLocaleString()}`,
      jointAngles: {}, // Would capture actual joint angles from rig
      timestamp: Date.now()
    };

    // Note: Actual capture would look something like:
    // const rig = this.systems.rig as any;
    // if (rig && rig.pivots) {
    //   for (const jointName of Object.keys(rig.pivots)) {
    //     preset.jointAngles[jointName] = {
    //       x: rig.pivots[jointName].rotation.x,
    //       y: rig.pivots[jointName].rotation.y,
    //       z: rig.pivots[jointName].rotation.z
    //     };
    //   }
    // }

    this.customPresets.push(preset);
    this.saveCustomPresets();
    this.refreshPresetList();

    console.log(`Saved pose preset: ${name}`);
  }

  /**
   * Load custom presets from localStorage
   */
  private loadCustomPresets(): PosePreset[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Failed to load custom presets:', e);
      return [];
    }
  }

  /**
   * Save custom presets to localStorage
   */
  private saveCustomPresets(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customPresets));
    } catch (e) {
      console.error('Failed to save custom presets:', e);
    }
  }

  /**
   * Clear all custom presets
   */
  private clearCustomPresets(): void {
    this.customPresets = [];
    localStorage.removeItem(STORAGE_KEY);
    this.refreshPresetList();
  }

  /**
   * Export presets to JSON file
   */
  private exportPresets(): void {
    const data = {
      builtIn: BUILT_IN_PRESETS,
      custom: this.customPresets
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'pose-presets.json';
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Import presets from JSON file
   */
  private importPresets(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.custom && Array.isArray(data.custom)) {
            // Merge custom presets
            for (const preset of data.custom) {
              if (!this.customPresets.find(p => p.name === preset.name)) {
                this.customPresets.push(preset);
              }
            }
            this.saveCustomPresets();
            this.refreshPresetList();
            console.log(`Imported ${data.custom.length} presets`);
          }
        } catch (err) {
          console.error('Failed to import presets:', err);
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }

  /**
   * Refresh the preset dropdown list
   */
  private refreshPresetList(): void {
    // Note: lil-gui doesn't have a clean way to update dropdown options
    // A full implementation would rebuild the GUI element
    console.log('Preset list updated');
  }

  /**
   * Get all available presets
   */
  getPresets(): { builtIn: PosePreset[]; custom: PosePreset[] } {
    return {
      builtIn: BUILT_IN_PRESETS,
      custom: this.customPresets
    };
  }
}

export default PosePresetsPanel;
