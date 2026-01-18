import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('three', async () => {
  const actual = await vi.importActual('three')

  class MockRenderer {
    constructor() {
      this.domElement = document.createElement('canvas')
      this.shadowMap = {}
    }
    setSize() {}
    setPixelRatio() {}
    render() {}
    dispose() {}
  }

  return { ...actual, WebGLRenderer: MockRenderer }
})

describe('core/SceneManager', () => {
  let SceneManager
  let THREE

  beforeEach(async () => {
    THREE = await import('three')
    ;({ SceneManager } = await import('./SceneManager.js'))
  })

  it('creates scene and attaches renderer', () => {
    const container = document.createElement('div')
    const manager = new SceneManager(container)

    expect(container.querySelector('canvas')).toBe(manager.renderer.domElement)
    expect(manager.scene).toBeInstanceOf(THREE.Scene)
  })

  it('adds and removes objects from the scene', () => {
    const container = document.createElement('div')
    const manager = new SceneManager(container)
    const obj = new THREE.Object3D()

    manager.add(obj)
    expect(manager.scene.children).toContain(obj)

    manager.remove(obj)
    expect(manager.scene.children).not.toContain(obj)
  })

  it('disposes renderer and removes canvas', () => {
    const container = document.createElement('div')
    const manager = new SceneManager(container)

    manager.dispose()

    expect(container.querySelector('canvas')).toBe(null)
  })
})
