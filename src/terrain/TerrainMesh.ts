import * as THREE from 'three';
import { TERRAIN } from '../config/index.js';
import type { TerrainHeightmap } from './TerrainHeightmap.js';
import type { DisposalTracker } from '../utils/disposal.js';

/**
 * Creates the visual Three.js terrain mesh
 */
export class TerrainMesh {
  heightmap: TerrainHeightmap;
  tracker: DisposalTracker;
  mesh: THREE.Mesh;
  grid: THREE.GridHelper;

  constructor(heightmap: TerrainHeightmap, tracker: DisposalTracker) {
    this.heightmap = heightmap;
    this.tracker = tracker;

    this.mesh = this.createMesh();
    this.grid = this.createGrid();
  }

  createMesh(): THREE.Mesh {
    const { size, segments, heights } = this.heightmap;

    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    this.tracker.trackGeometry(geometry);

    // Apply heightmap to vertices
    const positions = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < positions.count; i++) {
      positions.setZ(i, heights[i] ?? 0);
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

  createGrid(): THREE.GridHelper {
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
   */
  addToScene(scene: THREE.Scene): void {
    scene.add(this.mesh);
    scene.add(this.grid);
  }

  /**
   * Remove terrain from scene
   */
  removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.mesh);
    scene.remove(this.grid);
  }
}

export default TerrainMesh;
