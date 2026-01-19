import type { GUI } from 'lil-gui';
import type { GameConfig, GameSystems } from '../../types/index.js';

/**
 * Character physics and movement panel
 */
export class CharacterPanel {
  private config: GameConfig;
  private systems: GameSystems;
  private folder: GUI;

  constructor(gui: GUI, config: GameConfig, systems: GameSystems) {
    this.config = config;
    this.systems = systems;
    this.folder = gui.addFolder('Character');

    this.setupMovement();
    this.setupPhysics();
    this.setupCenterOfMass();

    this.folder.close();
  }

  private setupMovement(): void {
    const movement = this.folder.addFolder('Movement');
    const char = this.config.character;
    const controller = this.systems.controller;

    movement.add(char, 'WALK_SPEED', 1, 15, 0.5)
      .name('Walk Speed')
      .onChange((v: number) => { if (controller) controller.walkSpeed = v; });

    movement.add(char, 'RUN_SPEED', 5, 25, 0.5)
      .name('Run Speed')
      .onChange((v: number) => { if (controller) controller.runSpeed = v; });

    movement.add(char, 'GROUND_ACCEL', 10, 60, 1)
      .name('Ground Accel');

    movement.add(char, 'GROUND_DECEL', 20, 80, 1)
      .name('Ground Decel');

    movement.add(char, 'AIR_ACCEL', 1, 15, 0.5)
      .name('Air Accel');

    movement.add(char, 'TURN_SPEED', 2, 20, 0.5)
      .name('Turn Speed');

    movement.close();
  }

  private setupPhysics(): void {
    const physics = this.folder.addFolder('Physics');
    const char = this.config.character;
    const controller = this.systems.controller;

    physics.add(char, 'JUMP_VELOCITY', 5, 25, 0.5)
      .name('Jump Velocity')
      .onChange((v: number) => { if (controller) controller.jumpVelocity = v; });

    physics.add(char, 'GRAVITY', 10, 50, 1)
      .name('Gravity')
      .onChange((v: number) => { if (controller) controller.gravity = v; });

    physics.add(char, 'STEP_OFFSET', 0.1, 1.0, 0.05)
      .name('Step Offset');

    physics.add(char, 'SLOPE_LIMIT', 20, 60, 1)
      .name('Slope Limit');

    physics.add(char, 'SNAP_DISTANCE', 0.1, 1.0, 0.05)
      .name('Ground Snap');

    physics.close();
  }

  private setupCenterOfMass(): void {
    const com = this.folder.addFolder('Center of Mass');
    const char = this.config.character;

    com.add(char, 'COM_OFFSET_X', -1, 1, 0.05)
      .name('Offset X');

    com.add(char, 'COM_OFFSET_Y', -1, 1, 0.05)
      .name('Offset Y');

    com.add(char, 'COM_OFFSET_Z', -1, 1, 0.05)
      .name('Offset Z');

    com.add(char, 'COM_BALANCE_INFLUENCE', 0, 1, 0.05)
      .name('Balance Influence');

    com.add(char, 'COM_LEAN_COMPENSATION', 0, 2, 0.1)
      .name('Lean Compensation');

    com.close();
  }
}

export default CharacterPanel;
