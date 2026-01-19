import type { GUI } from 'lil-gui';
import type { GameConfig, GameSystems, TelemetryStats } from '../../types/index.js';

interface TelemetryData {
  state: string;
  speed: number;
  posX: number;
  posY: number;
  posZ: number;
  grounded: boolean;
  slopeAngle: number;
  leftFoot: string;
  rightFoot: string;
  facing: number;
  velocityY: number;
}

/**
 * Telemetry display panel (read-only values)
 */
export class TelemetryPanel {
  private config: GameConfig;
  private systems: GameSystems;
  private folder: GUI;
  private data: TelemetryData;

  constructor(gui: GUI, config: GameConfig, systems: GameSystems) {
    this.config = config;
    this.systems = systems;
    this.folder = gui.addFolder('Telemetry');

    // Suppress unused warnings for stored references
    void this.config;
    void this.systems;

    // Live telemetry data object
    this.data = {
      state: 'idle',
      speed: 0,
      posX: 0,
      posY: 0,
      posZ: 0,
      grounded: true,
      slopeAngle: 0,
      leftFoot: 'stance',
      rightFoot: 'stance',
      facing: 0,
      velocityY: 0
    };

    this.setupDisplay();

    // Keep telemetry folder open by default
    this.folder.open();
  }

  private setupDisplay(): void {
    const state = this.folder.addFolder('State');
    state.add(this.data, 'state').name('Movement').listen();
    state.add(this.data, 'speed').name('Speed (m/s)').listen();
    state.add(this.data, 'grounded').name('Grounded').listen();
    state.add(this.data, 'slopeAngle').name('Slope (°)').listen();
    state.open();

    const position = this.folder.addFolder('Position');
    position.add(this.data, 'posX').name('X').listen();
    position.add(this.data, 'posY').name('Y').listen();
    position.add(this.data, 'posZ').name('Z').listen();
    position.add(this.data, 'facing').name('Facing (°)').listen();
    position.add(this.data, 'velocityY').name('Vel Y').listen();
    position.open();

    const footIK = this.folder.addFolder('Foot IK');
    footIK.add(this.data, 'leftFoot').name('Left Foot').listen();
    footIK.add(this.data, 'rightFoot').name('Right Foot').listen();
    footIK.open();
  }

  /**
   * Update telemetry values
   */
  update(stats: TelemetryStats): void {
    if (!stats) return;

    this.data.state = stats.state || 'unknown';
    this.data.speed = parseFloat(String(stats.speed)) || 0;
    this.data.posX = parseFloat(String(stats.position?.x)) || 0;
    this.data.posY = parseFloat(String(stats.position?.y)) || 0;
    this.data.posZ = parseFloat(String(stats.position?.z)) || 0;
    this.data.grounded = stats.grounded ?? false;
    this.data.slopeAngle = parseFloat(String(stats.slopeAngle)) || 0;
    this.data.leftFoot = stats.leftFoot || 'unknown';
    this.data.rightFoot = stats.rightFoot || 'unknown';
    this.data.facing = parseFloat(String(stats.facing)) || 0;
    this.data.velocityY = parseFloat(String(stats.velocityY)) || 0;
  }
}

export default TelemetryPanel;
