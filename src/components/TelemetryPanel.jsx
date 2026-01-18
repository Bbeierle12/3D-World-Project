import React from 'react';

/**
 * Telemetry display panel
 * @param {object} props
 * @param {object} props.stats
 */
export function TelemetryPanel({ stats }) {
  return (
    <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg min-w-[200px]">
      <h2 className="text-lg font-bold mb-2 text-cyan-400">Telemetry</h2>
      <div className="space-y-1 text-sm font-mono">
        <div className="flex justify-between">
          <span className="text-gray-400">State:</span>
          <span className="text-cyan-300">{stats.state}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Speed:</span>
          <span className="text-green-400">{stats.speed} m/s</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Position:</span>
          <span className="text-yellow-400">({stats.position.x}, {stats.position.z})</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Grounded:</span>
          <span className={stats.grounded ? 'text-green-400' : 'text-red-400'}>
            {stats.grounded ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Slope:</span>
          <span className="text-orange-400">{stats.slopeAngle}°</span>
        </div>
        {stats.leftFoot && (
          <>
            <div className="border-t border-gray-600 my-2"></div>
            <div className="text-gray-300 font-semibold">Foot IK</div>
            <div className="flex justify-between">
              <span className="text-gray-400">Left:</span>
              <span className={stats.leftFoot === 'stance' ? 'text-green-400' : 'text-red-400'}>
                {stats.leftFoot}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Right:</span>
              <span className={stats.rightFoot === 'stance' ? 'text-green-400' : 'text-red-400'}>
                {stats.rightFoot}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TelemetryPanel;
