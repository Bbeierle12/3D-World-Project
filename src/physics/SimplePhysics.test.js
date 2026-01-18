import { describe, expect, it } from 'vitest'
import { TerrainHeightmap } from '../terrain/TerrainHeightmap.js'
import { SimplePhysics } from './SimplePhysics.js'

describe('physics/SimplePhysics', () => {
  it('probes ground and returns height and normal', () => {
    const physics = new SimplePhysics(new TerrainHeightmap(10, 2))
    const ground = physics.probeGround(0, 0)
    expect(ground.height).toBe(0)
    expect(ground.normal.y).toBeCloseTo(1, 5)
  })

  it('raycasts downward to terrain', () => {
    const physics = new SimplePhysics(new TerrainHeightmap(10, 2))
    const hit = physics.raycast({ x: 0, y: 5, z: 0 }, { x: 0, y: -1, z: 0 }, 10)
    expect(hit.hit).toBe(true)
    expect(hit.point.y).toBe(0)

    const miss = physics.raycast({ x: 0, y: 5, z: 0 }, { x: 0, y: 1, z: 0 }, 10)
    expect(miss.hit).toBe(false)
  })

  it('shapeCast returns a terrain hit at target position', () => {
    const physics = new SimplePhysics(new TerrainHeightmap(10, 2))
    const hit = physics.shapeCast({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 2, { type: 'sphere' })
    expect(hit.hit).toBe(true)
    expect(hit.point.x).toBe(2)
    expect(hit.point.y).toBe(0)
  })
})
