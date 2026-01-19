import { describe, expect, it } from 'vitest'
import { TerrainHeightmap } from '../terrain/TerrainHeightmap.js'
import { RapierPhysics } from './RapierPhysics.js'

describe('physics/RapierPhysics', () => {
  it('probes ground and returns height and normal', async () => {
    const physics = await RapierPhysics.create(new TerrainHeightmap(10, 2))
    try {
      const ground = physics.probeGround(0, 0)
      expect(ground.height).toBeCloseTo(0, 4)
      expect(ground.normal.y).toBeCloseTo(1, 4)
    } finally {
      physics.dispose()
    }
  })

  it('raycasts downward to terrain', async () => {
    const physics = await RapierPhysics.create(new TerrainHeightmap(10, 2))
    try {
      const hit = physics.raycast({ x: 0, y: 5, z: 0 }, { x: 0, y: -1, z: 0 }, 10)
      expect(hit.hit).toBe(true)
      expect(hit.point.y).toBeCloseTo(0, 4)
    } finally {
      physics.dispose()
    }
  })
})
