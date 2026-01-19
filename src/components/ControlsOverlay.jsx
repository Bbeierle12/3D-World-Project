import React from 'react';

/**
 * Static controls overlay
 */
export function ControlsOverlay() {
  return (
    <div className="absolute top-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg">
      <h1 className="text-xl font-bold mb-2 text-cyan-400">3D Stick Figure</h1>
      <div className="text-sm space-y-1">
        <div>WASD / Arrows - Move</div>
        <div>Shift - Run</div>
        <div>Space - Jump</div>
        <div>V - Toggle IK debug</div>
        <div>H - Toggle Debug HUD</div>
        <div>P - Screenshot</div>
        <div>O - Lock Pose</div>
        <div>R - Reset Camera</div>
        <div>L - Reset Location</div>
        <div>T - Toggle Telemetry</div>
        <div>Mouse Drag - Orbit Camera</div>
        <div>Shift + Drag / Middle Mouse - Pan</div>
        <div>Mouse Wheel - Zoom</div>
        <div>Buttons - Reset Location / Reset Camera / Screenshot</div>
      </div>
    </div>
  );
}

export default ControlsOverlay;
