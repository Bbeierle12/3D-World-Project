import * as THREE from 'three';
import { TERRAIN } from '../config/index.js';

/**
 * Creates the visual Three.js terrain mesh
 */
export class TerrainMesh {
  /**
   * @param {import('./TerrainHeightmap.js').TerrainHeightmap} heightmap
   * @param {import('../utils/disposal.js').DisposalTracker} tracker
   */
  constructor(heightmap, tracker) {
    this.heightmap = heightmap;
    this.tracker = tracker;

    this.mesh = this.createMesh();
    this.grid = this.createGrid();
  }

  createMesh() {
    const { size, segments, heights } = this.heightmap;

    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    this.tracker.trackGeometry(geometry);

    // Apply heightmap to vertices
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      positions.setZ(i, heights[i]);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: TERRAIN.COLOR,
      roughness: TERRAIN.ROUGHNESS
    });
    this.tracker.trackMaterial(material);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;

    return mesh;
  }

  createGrid() {
    const grid = new THREE.GridHelper(
      TERRAIN.SIZE,
      TERRAIN.GRID_DIVISIONS,
      TERRAIN.GRID_COLOR_CENTER,
      TERRAIN.GRID_COLOR_LINES
    );
    grid.position.y = 0.01;
    return grid;
  }

  /**
   * Add terrain to scene
   * @param {THREE.Scene} scene
   */
  addToScene(scene) {
    scene.add(this.mesh);
    scene.add(this.grid);
  }

  /**
   * Remove terrain from scene
   * @param {THREE.Scene} scene
   */
  removeFromScene(scene) {
    scene.remove(this.mesh);
    scene.remove(this.grid);
  }
}

export default TerrainMesh;
