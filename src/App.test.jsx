import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ControlsOverlay } from './components/ControlsOverlay.jsx'
import App from './App.jsx'

vi.mock('./components', () => ({
  Canvas3D: () => <div data-testid="canvas3d" />,
  ControlsOverlay
}))

describe('App', () => {
  it('renders canvas and controls overlay', async () => {
    render(<App />)

    expect(screen.getByTestId('canvas3d')).toBeInTheDocument()
    expect(screen.getByText('3D Stick Figure')).toBeInTheDocument()
  })
})
