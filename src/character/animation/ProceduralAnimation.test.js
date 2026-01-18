import { describe, expect, it } from 'vitest'
import { ProceduralAnimation } from './ProceduralAnimation.js'
import { MovementMode, GaitType } from '../controller/MovementModes.js'

describe('character/animation/ProceduralAnimation', () => {
  it('produces movement targets for running', () => {
    const anim = new ProceduralAnimation()
    anim.update(MovementMode.GROUNDED, GaitType.RUNNING, 0.25, 1, 0.1)

    const state = anim.getState()
    expect(state.torsoLean).toBeGreaterThan(0)
    expect(state.leftArmSwing).not.toBe(0)
  })

  it('breathes while idle', () => {
    const anim = new ProceduralAnimation()
    anim.update(MovementMode.GROUNDED, GaitType.IDLE, 0, 1, 0.1)

    const state = anim.getState()
    expect(state.torsoLean).not.toBe(0)
  })
})
