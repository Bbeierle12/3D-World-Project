import * as THREE from 'three';
import type { DisposalTracker } from '../../utils/disposal.js';

export interface CharacterMaterials {
  joint: THREE.MeshStandardMaterial;
  limb: THREE.MeshStandardMaterial;
  debugStance: THREE.MeshBasicMaterial;
  debugSwing: THREE.MeshBasicMaterial;
}

/**
 * Create character materials
 */
export function createCharacterMaterials(tracker: DisposalTracker): CharacterMaterials {
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
