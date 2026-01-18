import { describe, expect, it } from 'vitest'
import {
  lerp,
  clamp,
  wrapAngle,
  normalizeVector2,
  normalizeVector3,
  length2,
  length3,
  horizontalSpeed
} from './math.js'

describe('utils/math', () => {
  it('lerp interpolates between values', () => {
    expect(lerp(0, 10, 0.5)).toBe(5)
    expect(lerp(5, 15, 0)).toBe(5)
  })

  it('clamp clamps to range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })

  it('wrapAngle keeps value in [-PI, PI]', () => {
    expect(wrapAngle(Math.PI + 0.1)).toBeCloseTo(-Math.PI + 0.1, 5)
    expect(wrapAngle(-Math.PI - 0.2)).toBeCloseTo(Math.PI - 0.2, 5)
  })

  it('normalizes vectors and computes lengths', () => {
    const v2 = normalizeVector2({ x: 3, y: 4 })
    expect(length2(v2)).toBeCloseTo(1, 5)

    const v3 = normalizeVector3({ x: 0, y: 0, z: 0 })
    expect(v3).toEqual({ x: 0, y: 0, z: 0 })

    const v3b = normalizeVector3({ x: 1, y: 2, z: 2 })
    expect(length3(v3b)).toBeCloseTo(1, 5)
  })

  it('computes horizontal speed', () => {
    expect(horizontalSpeed({ x: 3, y: 4, z: 4 })).toBe(5)
  })
})
