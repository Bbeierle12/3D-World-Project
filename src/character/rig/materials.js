import * as THREE from 'three';

/**
 * Create character materials
 * @param {import('../../utils/disposal.js').DisposalTracker} tracker
 * @returns {object}
 */
export function createCharacterMaterials(tracker) {
  const joint = new THREE.MeshStandardMaterial({
    color: 0xff6b6b,
    roughness: 0.4,
    metalness: 0.2
  });
  tracker.trackMaterial(joint);

  const limb = new THREE.MeshStandardMaterial({
    color: 0x4ecdc4,
    roughness: 0.5,
    metalness: 0.3
  });
  tracker.trackMaterial(limb);

  const debugStance = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.5
  });
  tracker.trackMaterial(debugStance);

  const debugSwing = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.5
  });
  tracker.trackMaterial(debugSwing);

  return {
    joint,
    limb,
    debugStance,
    debugSwing
  };
}
