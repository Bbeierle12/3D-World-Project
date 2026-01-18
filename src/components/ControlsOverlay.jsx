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
      </div>
    </div>
  );
}

export default ControlsOverlay;
