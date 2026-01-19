import type { TerrainConfig } from '../types/index.js';

// Terrain parameters
export const TERRAIN: TerrainConfig = {
  // Size
  SIZE: 100,
  SEGMENTS: 50,

  // Height generation
  HEIGHT_SCALE: 0, // Set to 0 for flat terrain, 3 for hills
  NOISE_SCALE_1: 0.05,
  NOISE_SCALE_2: 0.1,
  NOISE_SCALE_3: 0.02,

  // Visual
  COLOR: 0x3a5f3a,
  ROUGHNESS: 0.8,
  METALNESS: 0.1,

  // Grid
  GRID_DIVISIONS: 50,
  GRID_COLOR_CENTER: 0x000000,
  GRID_COLOR_LINES: 0x444444
};

export default TERRAIN;
