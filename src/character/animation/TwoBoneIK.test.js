import { describe, expect, it } from 'vitest'
import { TwoBoneIK } from './TwoBoneIK.js'

describe('character/animation/TwoBoneIK', () => {
  it('returns valid angles and reach ratio', () => {
    const ik = new TwoBoneIK(2, 1)
    const result = ik.solve({ x: 0, y: 0, z: 0 }, { x: 0, y: -2, z: 0 }, 0)

    expect(result.lowerAngle).toBeGreaterThanOrEqual(0)
    expect(result.reachRatio).toBeGreaterThan(0)
    expect(result.reachRatio).toBeLessThanOrEqual(1)
  })
})
