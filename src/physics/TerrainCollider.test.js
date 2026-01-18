import { describe, expect, it } from 'vitest'
import { TerrainHeightmap } from '../terrain/TerrainHeightmap.js'
import { TerrainCollider } from './TerrainCollider.js'

describe('physics/TerrainCollider', () => {
  it('proxies height, normal, and slope angle', () => {
    const heightmap = new TerrainHeightmap(10, 2)
    const collider = new TerrainCollider(heightmap)

    expect(collider.getHeight(0, 0)).toBe(0)
    const normal = collider.getNormal(0, 0)
    expect(normal.y).toBeCloseTo(1, 5)
    expect(collider.getSlopeAngle(0, 0)).toBeCloseTo(0, 5)
  })
})
