import * as THREE from 'three';
import type { DisposalTracker } from '../../utils/disposal.js';
import type { CharacterMaterials } from './materials.js';

/**
 * Factory functions for building skeleton parts
 */
export class SkeletonBuilder {
  materials: CharacterMaterials;
  tracker: DisposalTracker;

  constructor(materials: CharacterMaterials, tracker: DisposalTracker) {
    this.materials = materials;
    this.tracker = tracker;
  }

  /**
   * Create a joint (sphere)
   */
  createJoint(radius: number = 0.3): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    this.tracker.trackGeometry(geometry);
    const mesh = new THREE.Mesh(geometry, this.materials.joint);
    mesh.castShadow = true;
    return mesh;
  }

  /**
   * Create a limb (cylinder)
   */
  createLimb(length: number, radius: number = 0.15): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
    this.tracker.trackGeometry(geometry);
    const mesh = new THREE.Mesh(geometry, this.materials.limb);
    mesh.castShadow = true;
    mesh.position.y = -length / 2;
    return mesh;
  }

  /**
   * Create a pivot group
   */
  createPivot(name: string): THREE.Group {
    const pivot = new THREE.Group();
    pivot.name = name;
    return pivot;
  }

  /**
   * Create debug marker
   */
  createDebugMarker(material: THREE.Material): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
    this.tracker.trackGeometry(geometry);
    return new THREE.Mesh(geometry, material);
  }
}

export default SkeletonBuilder;
