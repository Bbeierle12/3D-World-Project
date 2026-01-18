import { describe, expect, it } from 'vitest'
import { GaitType, MovementMode, getDisplayState, isAirborne } from './MovementModes.js'

describe('character/controller/MovementModes', () => {
  it('identifies airborne states', () => {
    expect(isAirborne(MovementMode.JUMPING)).toBe(true)
    expect(isAirborne(MovementMode.FALLING)).toBe(true)
    expect(isAirborne(MovementMode.GROUNDED)).toBe(false)
  })

  it('returns display state based on movement mode', () => {
    expect(getDisplayState(MovementMode.JUMPING, GaitType.WALKING)).toBe('jumping')
    expect(getDisplayState(MovementMode.LANDING, GaitType.RUNNING)).toBe('landing')
    expect(getDisplayState(MovementMode.GROUNDED, GaitType.WALKING)).toBe('walking')
  })
})
