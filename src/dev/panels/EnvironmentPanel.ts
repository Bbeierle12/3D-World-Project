import type { GUI, Controller } from 'lil-gui';
import type * as THREE from 'three';
import type { FollowCamera } from '../../camera/FollowCamera.js';
import type { CameraRanges, Range, CameraConfig, TerrainConfig, GameSystems } from '../../types/index.js';

// Type for camera controllers map
type CameraControllerKey = 'OFFSET_X' | 'OFFSET_Y' | 'OFFSET_Z' | 'LOOK_AT_Y' | 'POSITION_LERP' | 'FOV';
type CameraControllers = Partial<Record<CameraControllerKey, Controller>>;

// Type for config object passed to panel
interface PanelConfig {
  camera: CameraConfig;
  terrain: TerrainConfig;
}

// Type for terrain mesh with material
interface TerrainMeshWithMaterial {
  mesh: THREE.Mesh & {
    material: THREE.MeshStandardMaterial;
  } | null;
}

/**
 * Environment, camera, and terrain panel
 */
export class EnvironmentPanel {
  // Safe ranges for camera parameters (used for warnings)
  static readonly SAFE_RANGES: CameraRanges = {
    OFFSET_X: { min: -10, max: 10 },
    OFFSET_Y: { min: 2, max: 20 },
    OFFSET_Z: { min: 5, max: 30 },
    LOOK_AT_Y: { min: 0, max: 10 },
    POSITION_LERP: { min: 0.01, max: 0.2 },
    FOV: { min: 30, max: 90 }
  };

  // Extended ranges for experimentation
  static readonly EXTENDED_RANGES: CameraRanges = {
    OFFSET_X: { min: -50, max: 50 },
    OFFSET_Y: { min: -10, max: 50 },
    OFFSET_Z: { min: -20, max: 100 },
    LOOK_AT_Y: { min: -20, max: 30 },
    POSITION_LERP: { min: 0.001, max: 1 },
    FOV: { min: 5, max: 170 }
  };

  private config: PanelConfig;
  private systems: GameSystems;
  private folder: GUI;
  private cameraControllers: CameraControllers = {};

  constructor(gui: GUI, config: PanelConfig, systems: GameSystems) {
    this.config = config;
    this.systems = systems;
    this.folder = gui.addFolder('Environment');

    this.injectWarningStyles();
    this.setupCamera();
    this.setupTerrain();

    this.folder.close();
  }

  /**
   * Inject CSS for warning states
   */
  private injectWarningStyles(): void {
    if (document.getElementById('env-panel-warning-styles')) return;

    const style = document.createElement('style');
    style.id = 'env-panel-warning-styles';
    style.textContent = `
      .lil-gui .controller.out-of-range .name {
        color: #ffaa00 !important;
      }
      .lil-gui .controller.out-of-range .name::after {
        content: ' ⚠';
      }
      .lil-gui .controller.out-of-range input[type="number"],
      .lil-gui .controller.out-of-range .slider {
        background: rgba(255, 170, 0, 0.2) !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Check if value is outside safe range and update warning state
   */
  private checkRange(controller: Controller | undefined, param: CameraControllerKey, value: number): void {
    const safe: Range | undefined = EnvironmentPanel.SAFE_RANGES[param];
    if (!safe || !controller) return;

    const isOutOfRange = value < safe.min || value > safe.max;
    controller.domElement.closest('.controller')?.classList.toggle('out-of-range', isOutOfRange);
  }

  private setupCamera(): void {
    const camera = this.folder.addFolder('Camera');
    const cam = this.config.camera;
    const followCam = this.systems.camera as FollowCamera | undefined;
    const ext = EnvironmentPanel.EXTENDED_RANGES;

    // Store controllers for reset functionality
    this.cameraControllers.OFFSET_X = camera.add(cam, 'OFFSET_X', ext.OFFSET_X.min, ext.OFFSET_X.max, 0.5)
      .name('Offset X')
      .onChange((v: number) => {
        if (followCam) followCam.offset.x = v;
        this.checkRange(this.cameraControllers.OFFSET_X, 'OFFSET_X', v);
      });

    this.cameraControllers.OFFSET_Y = camera.add(cam, 'OFFSET_Y', ext.OFFSET_Y.min, ext.OFFSET_Y.max, 0.5)
      .name('Offset Y')
      .onChange((v: number) => {
        if (followCam) followCam.offset.y = v;
        this.checkRange(this.cameraControllers.OFFSET_Y, 'OFFSET_Y', v);
      });

    this.cameraControllers.OFFSET_Z = camera.add(cam, 'OFFSET_Z', ext.OFFSET_Z.min, ext.OFFSET_Z.max, 0.5)
      .name('Offset Z')
      .onChange((v: number) => {
        if (followCam) followCam.offset.z = v;
        this.checkRange(this.cameraControllers.OFFSET_Z, 'OFFSET_Z', v);
      });

    this.cameraControllers.LOOK_AT_Y = camera.add(cam, 'LOOK_AT_Y', ext.LOOK_AT_Y.min, ext.LOOK_AT_Y.max, 0.5)
      .name('Look At Y')
      .onChange((v: number) => {
        // TypeScript enforces: followCam.lookAtOffset is Vector3Like (object)
        // Writing `followCam.lookAtOffset = v` would be a type error!
        if (followCam) followCam.lookAtOffset.y = v;
        this.checkRange(this.cameraControllers.LOOK_AT_Y, 'LOOK_AT_Y', v);
      });

    this.cameraControllers.POSITION_LERP = camera.add(cam, 'POSITION_LERP', ext.POSITION_LERP.min, ext.POSITION_LERP.max, 0.01)
      .name('Position Smooth')
      .onChange((v: number) => {
        // TypeScript enforces: property is `positionSmoothing`, not `positionLerp`
        // Writing `followCam.positionLerp = v` would be a type error!
        if (followCam) followCam.positionSmoothing = v;
        this.checkRange(this.cameraControllers.POSITION_LERP, 'POSITION_LERP', v);
      });

    this.cameraControllers.FOV = camera.add(cam, 'FOV', ext.FOV.min, ext.FOV.max, 1)
      .name('Field of View')
      .onChange((v: number) => {
        const cam3D = (this.systems.sceneManager?.camera ?? this.systems.camera?.camera) as THREE.PerspectiveCamera | undefined;
        if (cam3D) {
          cam3D.fov = v;
          cam3D.updateProjectionMatrix();
        }
        this.checkRange(this.cameraControllers.FOV, 'FOV', v);
      });

    // Reset button to snap back to safe defaults
    camera.add({ reset: () => this.resetCamera() }, 'reset').name('↺ Reset Camera');

    camera.close();
  }

  /**
   * Reset camera to safe default values
   */
  resetCamera(): void {
    const cam = this.config.camera;
    const followCam = this.systems.camera as FollowCamera | undefined;
    const cam3D = (this.systems.sceneManager?.camera ?? this.systems.camera?.camera) as THREE.PerspectiveCamera | undefined;

    // Default safe values from camera config
    const defaults: Record<CameraControllerKey, number> = {
      OFFSET_X: 0,
      OFFSET_Y: 8,
      OFFSET_Z: 15,
      LOOK_AT_Y: 3,
      POSITION_LERP: 0.05,
      FOV: 60
    };

    // Apply defaults to config
    (Object.entries(defaults) as [CameraControllerKey, number][]).forEach(([key, value]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cam as any)[key] = value;
      this.cameraControllers[key]?.setValue(value);
      // Clear warning state
      this.cameraControllers[key]?.domElement.closest('.controller')?.classList.remove('out-of-range');
    });

    // Apply to live camera
    if (followCam) {
      followCam.offset.x = defaults.OFFSET_X;
      followCam.offset.y = defaults.OFFSET_Y;
      followCam.offset.z = defaults.OFFSET_Z;
      followCam.lookAtOffset.y = defaults.LOOK_AT_Y;
      followCam.positionSmoothing = defaults.POSITION_LERP;
    }

    if (cam3D) {
      cam3D.fov = defaults.FOV;
      cam3D.updateProjectionMatrix();
    }

    console.log('Camera reset to safe defaults');
  }

  private setupTerrain(): void {
    const terrain = this.folder.addFolder('Terrain');
    const ter = this.config.terrain;

    terrain.add(ter, 'HEIGHT_SCALE', 0, 10, 0.5)
      .name('Height Scale')
      .onChange(() => this.rebuildTerrain());

    terrain.add(ter, 'NOISE_SCALE_1', 0.01, 0.2, 0.01)
      .name('Noise Scale 1')
      .onChange(() => this.rebuildTerrain());

    terrain.add(ter, 'NOISE_SCALE_2', 0.01, 0.3, 0.01)
      .name('Noise Scale 2')
      .onChange(() => this.rebuildTerrain());

    terrain.addColor(ter, 'COLOR')
      .name('Color')
      .onChange((v: number) => {
        const terrainMesh = this.systems.terrainMesh as TerrainMeshWithMaterial | undefined;
        if (terrainMesh?.mesh) {
          terrainMesh.mesh.material.color.setHex(v);
        }
      });

    terrain.add(ter, 'ROUGHNESS', 0, 1, 0.05)
      .name('Roughness')
      .onChange((v: number) => {
        const terrainMesh = this.systems.terrainMesh as TerrainMeshWithMaterial | undefined;
        if (terrainMesh?.mesh) {
          terrainMesh.mesh.material.roughness = v;
        }
      });

    terrain.close();
  }

  private rebuildTerrain(): void {
    // Terrain rebuild would require recreating heightmap
    // For now, just log that it needs rebuild
    console.log('Terrain params changed - rebuild required for full effect');
  }
}

export default EnvironmentPanel;
