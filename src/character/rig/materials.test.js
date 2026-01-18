import { describe, expect, it } from 'vitest'
import { createCharacterMaterials } from './materials.js'
import { DisposalTracker } from '../../utils/disposal.js'

describe('character/rig/materials', () => {
  it('creates and tracks character materials', () => {
    const tracker = new DisposalTracker()
    const materials = createCharacterMaterials(tracker)

    expect(materials.joint).toBeDefined()
    expect(materials.limb).toBeDefined()
    expect(materials.debugStance.transparent).toBe(true)
    expect(materials.debugSwing.opacity).toBeCloseTo(0.5, 5)
    expect(tracker.materials).toHaveLength(4)
  })
})
