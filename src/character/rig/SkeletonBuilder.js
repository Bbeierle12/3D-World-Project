import * as THREE from 'three';

/**
 * Factory functions for building skeleton parts
 */
export class SkeletonBuilder {
  /**
   * @param {object} materials
   * @param {import('../../utils/disposal.js').DisposalTracker} tracker
   */
  constructor(materials, tracker) {
    this.materials = materials;
    this.tracker = tracker;
  }

  /**
   * Create a joint (sphere)
   * @param {number} radius
   * @returns {THREE.Mesh}
   */
  createJoint(radius = 0.3) {
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    this.tracker.trackGeometry(geometry);
    const mesh = new THREE.Mesh(geometry, this.materials.joint);
    mesh.castShadow = true;
    return mesh;
  }

  /**
   * Create a limb (cylinder)
   * @param {number} length
   * @param {number} radius
   * @returns {THREE.Mesh}
   */
  createLimb(length, radius = 0.15) {
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
    this.tracker.trackGeometry(geometry);
    const mesh = new THREE.Mesh(geometry, this.materials.limb);
    mesh.castShadow = true;
    mesh.position.y = -length / 2;
    return mesh;
  }

  /**
   * Create a pivot group
   * @param {string} name
   * @returns {THREE.Group}
   */
  createPivot(name) {
    const pivot = new THREE.Group();
    pivot.name = name;
    return pivot;
  }

  /**
   * Create debug marker
   * @param {THREE.Material} material
   * @returns {THREE.Mesh}
   */
  createDebugMarker(material) {
    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
    this.tracker.trackGeometry(geometry);
    return new THREE.Mesh(geometry, material);
  }
}

export default SkeletonBuilder;
