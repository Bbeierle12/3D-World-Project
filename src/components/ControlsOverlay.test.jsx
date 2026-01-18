import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ControlsOverlay } from './ControlsOverlay.jsx'

describe('components/ControlsOverlay', () => {
  it('renders control hints', () => {
    render(<ControlsOverlay />)

    expect(screen.getByText('3D Stick Figure')).toBeInTheDocument()
    expect(screen.getByText('WASD / Arrows - Move')).toBeInTheDocument()
    expect(screen.getByText('Shift - Run')).toBeInTheDocument()
    expect(screen.getByText('Space - Jump')).toBeInTheDocument()
  })
})
