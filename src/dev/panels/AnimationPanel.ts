import type { GUI } from 'lil-gui';
import type { GameConfig, GameSystems, AnimationConfig } from '../../types/index.js';

/**
 * Animation and IK parameters panel
 */
export class AnimationPanel {
  private config: GameConfig;
  private systems: GameSystems;
  private folder: GUI;

  constructor(gui: GUI, config: GameConfig, systems: GameSystems) {
    this.config = config;
    this.systems = systems;
    this.folder = gui.addFolder('Animation');

    this.setupFootIK();
    this.setupStride();
    this.setupUpperBody();

    this.folder.close();
  }

  private setupFootIK(): void {
    const ik = this.folder.addFolder('Foot IK');
    const anim = this.config.animation as AnimationConfig;
    const footIK = this.systems.footIK;

    ik.add(anim, 'IK_BLEND_SPEED', 1, 20, 0.5)
      .name('Blend Speed');

    ik.add(anim, 'FOOT_PLANT_TOLERANCE', 0.01, 0.5, 0.01)
      .name('Plant Tolerance');

    ik.add(anim, 'PELVIS_DROP_MAX', 0, 1, 0.05)
      .name('Pelvis Drop Max');

    ik.add(anim, 'UPPER_LEG_LENGTH', 1, 3, 0.1)
      .name('Upper Leg')
      .onChange((v: number) => {
        if (footIK) {
          footIK.upperLegLength = v;
          footIK.legLength = v + anim.LOWER_LEG_LENGTH;
        }
      });

    ik.add(anim, 'LOWER_LEG_LENGTH', 1, 3, 0.1)
      .name('Lower Leg')
      .onChange((v: number) => {
        if (footIK) {
          footIK.lowerLegLength = v;
          footIK.legLength = anim.UPPER_LEG_LENGTH + v;
        }
      });

    ik.close();
  }

  private setupStride(): void {
    const stride = this.folder.addFolder('Stride');
    const anim = this.config.animation;

    stride.add(anim, 'WALK_STRIDE_LENGTH', 0.5, 3, 0.1)
      .name('Walk Length');

    stride.add(anim, 'RUN_STRIDE_LENGTH', 1, 4, 0.1)
      .name('Run Length');

    stride.add(anim, 'WALK_STRIDE_HEIGHT', 0.1, 1, 0.05)
      .name('Walk Height');

    stride.add(anim, 'RUN_STRIDE_HEIGHT', 0.2, 1.5, 0.05)
      .name('Run Height');

    stride.add(anim, 'WALK_CYCLE_SPEED', 2, 15, 0.5)
      .name('Walk Cycle Speed');

    stride.add(anim, 'RUN_CYCLE_SPEED', 5, 20, 0.5)
      .name('Run Cycle Speed');

    stride.close();
  }

  private setupUpperBody(): void {
    const upper = this.folder.addFolder('Upper Body');
    const anim = this.config.animation;

    upper.add(anim, 'ARM_SWING_WALK', 0, 1.5, 0.05)
      .name('Arm Swing (Walk)');

    upper.add(anim, 'ARM_SWING_RUN', 0, 1.5, 0.05)
      .name('Arm Swing (Run)');

    upper.add(anim, 'ELBOW_BEND_BASE', 0, 0.5, 0.02)
      .name('Elbow Bend');

    upper.add(anim, 'TORSO_LEAN_WALK', 0, 0.3, 0.01)
      .name('Torso Lean (Walk)');

    upper.add(anim, 'TORSO_LEAN_RUN', 0, 0.5, 0.01)
      .name('Torso Lean (Run)');

    upper.add(anim, 'TORSO_TWIST_AMOUNT', 0, 0.2, 0.01)
      .name('Torso Twist');

    upper.add(anim, 'HEAD_BOB_AMOUNT', 0, 0.1, 0.005)
      .name('Head Bob');

    upper.add(anim, 'HIP_SWAY_AMOUNT', 0, 0.1, 0.005)
      .name('Hip Sway');

    upper.add(anim, 'BREATHE_AMPLITUDE', 0, 0.1, 0.005)
      .name('Breathe Amount');

    upper.add(anim, 'BREATHE_SPEED', 0.5, 5, 0.1)
      .name('Breathe Speed');

    upper.close();
  }
}

export default AnimationPanel;
