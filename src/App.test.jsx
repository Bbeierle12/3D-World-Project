import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

vi.mock('./components', async () => {
  const actual = await vi.importActual('./components')

  const Canvas3D = () => {
    return <div data-testid="canvas3d" />
  }

  return {
    ...actual,
    Canvas3D
  }
})

describe('App', () => {
  it('renders canvas and controls overlay', async () => {
    render(<App />)

    expect(screen.getByTestId('canvas3d')).toBeInTheDocument()
    expect(screen.getByText('3D Stick Figure')).toBeInTheDocument()
  })
})
