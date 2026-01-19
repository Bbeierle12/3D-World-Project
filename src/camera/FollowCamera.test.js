import { describe, expect, it, vi } from 'vitest'
import { FollowCamera } from './FollowCamera.js'
import { CAMERA } from '../config/camera.js'

describe('camera/FollowCamera', () => {
  it('follows target with smoothing and lookAt', () => {
    const camera = {
      position: { x: 0, y: 0, z: 0 },
      lookAt: vi.fn()
    }

    const follow = new FollowCamera(camera)
    follow.update({ x: 10, y: 2, z: -5 }, 0.016)

    const flatDistance = Math.hypot(CAMERA.OFFSET_X, CAMERA.OFFSET_Z)
    const distance = Math.hypot(flatDistance, CAMERA.OFFSET_Y)
    const yaw = Math.atan2(CAMERA.OFFSET_X, CAMERA.OFFSET_Z)
    const pitch = Math.atan2(CAMERA.OFFSET_Y, Math.max(0.0001, flatDistance))

    const offsetX = distance * Math.cos(pitch) * Math.sin(yaw)
    const offsetY = distance * Math.sin(pitch)
    const offsetZ = distance * Math.cos(pitch) * Math.cos(yaw)

    const targetX = 10 + offsetX
    const targetY = 2 + offsetY
    const targetZ = -5 + offsetZ

    expect(camera.position.x).toBeCloseTo(targetX * CAMERA.POSITION_LERP, 5)
    expect(camera.position.y).toBeCloseTo(targetY * CAMERA.POSITION_LERP, 5)
    expect(camera.position.z).toBeCloseTo(targetZ * CAMERA.POSITION_LERP, 5)

    expect(camera.lookAt).toHaveBeenCalledWith(10, 2 + CAMERA.LOOK_AT_Y, -5)
  })
})
