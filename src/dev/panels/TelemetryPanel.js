/**
 * Telemetry display panel (read-only values)
 */
export class TelemetryPanel {
  /**
   * @param {import('lil-gui').GUI} gui - Parent GUI
   * @param {object} config - Live config object
   * @param {object} systems - Game systems
   */
  constructor(gui, config, systems) {
    this.config = config;
    this.systems = systems;
    this.folder = gui.addFolder('Telemetry');

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

  setupDisplay() {
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
   * @param {object} stats - Stats from game loop
   */
  update(stats) {
    if (!stats) return;

    this.data.state = stats.state || 'unknown';
    this.data.speed = parseFloat(stats.speed) || 0;
    this.data.posX = parseFloat(stats.position?.x) || 0;
    this.data.posY = parseFloat(stats.position?.y) || 0;
    this.data.posZ = parseFloat(stats.position?.z) || 0;
    this.data.grounded = stats.grounded ?? false;
    this.data.slopeAngle = parseFloat(stats.slopeAngle) || 0;
    this.data.leftFoot = stats.leftFoot || 'unknown';
    this.data.rightFoot = stats.rightFoot || 'unknown';
    this.data.facing = parseFloat(stats.facing) || 0;
    this.data.velocityY = parseFloat(stats.velocityY) || 0;
  }
}

export default TelemetryPanel;
