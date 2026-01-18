/**
 * Environment, camera, and terrain panel
 */
export class EnvironmentPanel {
  /**
   * @param {import('lil-gui').GUI} gui - Parent GUI
   * @param {object} config - Live config object
   * @param {object} systems - Game systems
   */
  constructor(gui, config, systems) {
    this.config = config;
    this.systems = systems;
    this.folder = gui.addFolder('Environment');

    this.setupCamera();
    this.setupTerrain();

    this.folder.close();
  }

  setupCamera() {
    const camera = this.folder.addFolder('Camera');
    const cam = this.config.camera;
    const followCam = this.systems.camera;

    camera.add(cam, 'OFFSET_X', -10, 10, 0.5)
      .name('Offset X')
      .onChange(v => { if (followCam) followCam.offset.x = v; });

    camera.add(cam, 'OFFSET_Y', 2, 20, 0.5)
      .name('Offset Y')
      .onChange(v => { if (followCam) followCam.offset.y = v; });

    camera.add(cam, 'OFFSET_Z', 5, 30, 0.5)
      .name('Offset Z')
      .onChange(v => { if (followCam) followCam.offset.z = v; });

    camera.add(cam, 'LOOK_AT_Y', 0, 10, 0.5)
      .name('Look At Y')
      .onChange(v => { if (followCam) followCam.lookAtOffset = v; });

    camera.add(cam, 'POSITION_LERP', 0.01, 0.2, 0.01)
      .name('Position Smooth')
      .onChange(v => { if (followCam) followCam.positionLerp = v; });

    camera.add(cam, 'FOV', 30, 90, 1)
      .name('Field of View')
      .onChange(v => {
        // Access camera via sceneManager or followCamera
        const cam3D = this.systems.sceneManager?.camera || this.systems.camera?.camera;
        if (cam3D) {
          cam3D.fov = v;
          cam3D.updateProjectionMatrix();
        }
      });

    camera.close();
  }

  setupTerrain() {
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
      .onChange(v => {
        if (this.systems.terrainMesh?.mesh) {
          this.systems.terrainMesh.mesh.material.color.setHex(v);
        }
      });

    terrain.add(ter, 'ROUGHNESS', 0, 1, 0.05)
      .name('Roughness')
      .onChange(v => {
        if (this.systems.terrainMesh?.mesh) {
          this.systems.terrainMesh.mesh.material.roughness = v;
        }
      });

    terrain.close();
  }

  rebuildTerrain() {
    // Terrain rebuild would require recreating heightmap
    // For now, just log that it needs rebuild
    console.log('Terrain params changed - rebuild required for full effect');
  }
}

export default EnvironmentPanel;
