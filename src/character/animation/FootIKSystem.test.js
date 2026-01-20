import { describe, expect, it } from 'vitest'
import { FootIKSystem } from './FootIKSystem.js'
import { MovementMode, GaitType } from '../controller/MovementModes.js'

const flatHeight = () => 0
const flatNormal = () => ({ x: 0, y: 1, z: 0 })

describe('character/animation/FootIKSystem', () => {
  it('computes foot targets and phases when idle', () => {
    const ik = new FootIKSystem(1, 1, 1)

    ik.computeFootTargets(
      { x: 0, y: 0, z: 0 },
      0,
      { x: 0, y: 0, z: 0 },
      GaitType.IDLE,
      0.016,
      flatHeight,
      flatNormal,
      null
    )

    expect(ik.leftFoot.worldTarget.y).toBe(0)
    expect(ik.rightFoot.worldTarget.y).toBe(0)
    expect(ik.leftFoot.phase).toBe('stance')
    expect(ik.rightFoot.phase).toBe('swing')
  })

  it('advances cycle phase when moving', () => {
    const ik = new FootIKSystem(1, 1, 1)
    ik.computeFootTargets(
      { x: 0, y: 0, z: 0 },
      0,
      { x: 1, y: 0, z: 0 },
      GaitType.WALKING,
      1,
      flatHeight,
      flatNormal,
      null
    )

    expect(ik.cyclePhase).toBeGreaterThan(0)
  })

  it('computes pelvis offset based on foot heights', () => {
    const ik = new FootIKSystem(1, 1, 1)
    ik.leftFoot.terrainHeight = 1
    ik.rightFoot.terrainHeight = 0

    const offset = ik.computePelvisOffset({ x: 0, y: 0, z: 0 }, 0)
    expect(offset).toBeLessThan(0)
  })

  it('returns IK blend weight by movement mode', () => {
    const ik = new FootIKSystem(1, 1, 1)
    expect(ik.getIKBlendWeight(MovementMode.GROUNDED)).toBe(1)
    expect(ik.getIKBlendWeight(MovementMode.LANDING)).toBe(0.5)
    expect(ik.getIKBlendWeight(MovementMode.JUMPING)).toBe(0)
  })
})
