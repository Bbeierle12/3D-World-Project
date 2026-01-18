import { describe, expect, it } from 'vitest'
import { TerrainHeightmap } from './TerrainHeightmap.js'

describe('terrain/TerrainHeightmap', () => {
  it('generates a flat heightmap with current config', () => {
    const heightmap = new TerrainHeightmap(10, 4)
    const unique = new Set(heightmap.heights)
    expect(unique.size).toBe(1)
    expect(heightmap.getHeight(0, 0)).toBe(0)
    expect(heightmap.getHeight(1000, 1000)).toBe(0)
  })

  it('returns normalized upward normal on flat terrain', () => {
    const heightmap = new TerrainHeightmap(10, 4)
    const normal = heightmap.getNormal(0, 0)
    expect(normal.x).toBeCloseTo(0, 5)
    expect(normal.y).toBeCloseTo(1, 5)
    expect(normal.z).toBeCloseTo(0, 5)
  })
})
