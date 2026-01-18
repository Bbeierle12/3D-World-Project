import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TelemetryPanel } from './TelemetryPanel.jsx'

describe('components/TelemetryPanel', () => {
  it('renders stats and foot IK when provided', () => {
    render(
      <TelemetryPanel
        stats={{
          speed: '3.4',
          state: 'walking',
          position: { x: '1.0', z: '-2.0' },
          grounded: true,
          slopeAngle: '5',
          leftFoot: 'stance',
          rightFoot: 'swing'
        }}
      />
    )

    expect(screen.getByText('walking')).toBeInTheDocument()
    expect(screen.getByText('(1.0, -2.0)')).toBeInTheDocument()
    expect(screen.getByText('Foot IK')).toBeInTheDocument()
    expect(screen.getByText('stance')).toBeInTheDocument()
    expect(screen.getByText('swing')).toBeInTheDocument()
  })

  it('hides foot IK section when data missing', () => {
    render(
      <TelemetryPanel
        stats={{
          speed: '0.0',
          state: 'idle',
          position: { x: '0.0', z: '0.0' },
          grounded: true,
          slopeAngle: '0'
        }}
      />
    )

    expect(screen.queryByText('Foot IK')).toBeNull()
  })
})
