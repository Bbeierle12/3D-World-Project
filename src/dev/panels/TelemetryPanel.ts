import type { GUI } from 'lil-gui';
import type { GameConfig, GameSystems, TelemetryStats, CoMState } from '../../types/index.js';

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

interface CoMData {
  comX: number;
  comY: number;
  comZ: number;
  comVelX: number;
  comVelY: number;
  comVelZ: number;
  comSpeed: number;
  stabilityMargin: number;
  isStable: boolean;
  stabilityLevel: string;
}

/**
 * Telemetry display panel (read-only values)
 */
export class TelemetryPanel {
  private config: GameConfig;
  private systems: GameSystems;
  private folder: GUI;
  private data: TelemetryData;
  private comData: CoMData;

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

    // CoM telemetry data
    this.comData = {
      comX: 0,
      comY: 0,
      comZ: 0,
      comVelX: 0,
      comVelY: 0,
      comVelZ: 0,
      comSpeed: 0,
      stabilityMargin: 0,
      isStable: true,
      stabilityLevel: 'stable'
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

    // Center of Mass section
    const com = this.folder.addFolder('Center of Mass');

    const comPos = com.addFolder('Position');
    comPos.add(this.comData, 'comX').name('X').listen();
    comPos.add(this.comData, 'comY').name('Y').listen();
    comPos.add(this.comData, 'comZ').name('Z').listen();
    comPos.close();

    const comVel = com.addFolder('Velocity');
    comVel.add(this.comData, 'comSpeed').name('Speed (m/s)').listen();
    comVel.add(this.comData, 'comVelX').name('Vel X').listen();
    comVel.add(this.comData, 'comVelY').name('Vel Y').listen();
    comVel.add(this.comData, 'comVelZ').name('Vel Z').listen();
    comVel.close();

    const stability = com.addFolder('Stability');
    stability.add(this.comData, 'stabilityLevel').name('Level').listen();
    stability.add(this.comData, 'stabilityMargin').name('Margin (m)').listen();
    stability.add(this.comData, 'isStable').name('Is Stable').listen();
    stability.open();

    com.close(); // Closed by default to reduce clutter
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

  /**
   * Update Center of Mass telemetry
   */
  updateCoM(state: CoMState): void {
    if (!state) return;

    // Position
    this.comData.comX = parseFloat(state.position.x.toFixed(3));
    this.comData.comY = parseFloat(state.position.y.toFixed(3));
    this.comData.comZ = parseFloat(state.position.z.toFixed(3));

    // Velocity
    this.comData.comVelX = parseFloat(state.velocity.x.toFixed(2));
    this.comData.comVelY = parseFloat(state.velocity.y.toFixed(2));
    this.comData.comVelZ = parseFloat(state.velocity.z.toFixed(2));

    // Speed (magnitude)
    const speed = Math.sqrt(
      state.velocity.x ** 2 +
      state.velocity.y ** 2 +
      state.velocity.z ** 2
    );
    this.comData.comSpeed = parseFloat(speed.toFixed(2));

    // Stability
    this.comData.stabilityMargin = parseFloat(state.stabilityMargin.toFixed(3));
    this.comData.isStable = state.isStable;
    this.comData.stabilityLevel = state.stabilityLevel;
  }
}

export default TelemetryPanel;
