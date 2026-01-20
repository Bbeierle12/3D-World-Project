import React from 'react';

/**
 * Telemetry display panel
 * @param {object} props
 * @param {object} props.stats
 * @param {object} [props.com]
 * @param {object} [props.perf]
 */
export function TelemetryPanel({ stats, com, perf, pose, onSelectPoseJoint }) {
  const formatValue = (value, digits = 2) => {
    if (typeof value === 'number') {
      return value.toFixed(digits);
    }
    if (typeof value === 'string') {
      return value;
    }
    return '0';
  };

  const stabilityClass = (level) => {
    if (level === 'stable') return 'text-green-400';
    if (level === 'warning') return 'text-yellow-400';
    if (level === 'unstable') return 'text-red-400';
    return 'text-gray-300';
  };
  const toDegrees = (radians) => (typeof radians === 'number'
    ? radians * (180 / Math.PI)
    : 0);

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
          <span className="text-green-400">{formatValue(stats.speed)} m/s</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Position:</span>
          <span className="text-yellow-400">
            ({formatValue(stats.position?.x)}, {formatValue(stats.position?.z)})
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Grounded:</span>
          <span className={stats.grounded ? 'text-green-400' : 'text-red-400'}>
            {stats.grounded ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Slope:</span>
          <span className="text-orange-400">{formatValue(stats.slopeAngle, 1)}°</span>
        </div>
        {stats.input && (
          <div className="flex justify-between">
            <span className="text-gray-400">Input:</span>
            <span className="text-blue-300">
              ({formatValue(stats.input.x, 2)}, {formatValue(stats.input.y, 2)})
            </span>
          </div>
        )}
        {stats.inputWorld && (
          <div className="flex justify-between">
            <span className="text-gray-400">Move Dir:</span>
            <span className="text-blue-300">
              ({formatValue(stats.inputWorld.x, 2)}, {formatValue(stats.inputWorld.z, 2)})
            </span>
          </div>
        )}
        {stats.velocity && (
          <div className="flex justify-between">
            <span className="text-gray-400">Velocity:</span>
            <span className="text-blue-300">
              ({formatValue(stats.velocity.x, 2)}, {formatValue(stats.velocity.z, 2)})
            </span>
          </div>
        )}
        {typeof stats.directionDot === 'number' && (
          <div className="flex justify-between">
            <span className="text-gray-400">Dir Dot:</span>
            <span className="text-blue-300">{formatValue(stats.directionDot, 2)}</span>
          </div>
        )}
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
        {com && (
          <>
            <div className="border-t border-gray-600 my-2"></div>
            <div className="text-gray-300 font-semibold">Center of Mass</div>
            <div className="flex justify-between">
              <span className="text-gray-400">Position:</span>
              <span className="text-yellow-300">
                ({formatValue(com.position?.x, 3)}, {formatValue(com.position?.y, 3)}, {formatValue(com.position?.z, 3)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Speed:</span>
              <span className="text-green-300">{formatValue(com.speed)} m/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Stability:</span>
              <span className={stabilityClass(com.stabilityLevel)}>
                {com.stabilityLevel}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Margin:</span>
              <span className="text-cyan-200">{formatValue(com.stabilityMargin, 3)} m</span>
            </div>
          </>
        )}
        {perf && (
          <>
            <div className="border-t border-gray-600 my-2"></div>
            <div className="text-gray-300 font-semibold">Performance</div>
            <div className="flex justify-between">
              <span className="text-gray-400">FPS:</span>
              <span className="text-green-300">{formatValue(perf.fps, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Frame:</span>
              <span className="text-yellow-300">{formatValue(perf.frameTime, 2)} ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Backend:</span>
              <span className="text-cyan-300">{perf.backend}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pixel Ratio:</span>
              <span className="text-cyan-300">{formatValue(perf.pixelRatio, 2)}</span>
            </div>
          </>
        )}
        {pose?.joints?.length > 0 && (
          <>
            <div className="border-t border-gray-600 my-2"></div>
            <div className="text-gray-300 font-semibold">Pose Debug</div>
            <select
              className="w-full rounded border border-white/10 bg-black/50 px-2 py-1 text-xs text-white"
              onChange={(event) => onSelectPoseJoint?.(event.target.value)}
              value={pose.selected}
            >
              {pose.joints.map((joint) => (
                <option key={joint} value={joint}>
                  {joint}
                </option>
              ))}
            </select>
            {pose.data && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pos:</span>
                  <span className="text-purple-200">
                    ({formatValue(pose.data.position?.x, 3)}, {formatValue(pose.data.position?.y, 3)}, {formatValue(pose.data.position?.z, 3)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Local Rot:</span>
                  <span className="text-purple-200">
                    ({formatValue(toDegrees(pose.data.localRotation?.x), 1)}°, {formatValue(toDegrees(pose.data.localRotation?.y), 1)}°, {formatValue(toDegrees(pose.data.localRotation?.z), 1)}°)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">World Rot:</span>
                  <span className="text-purple-200">
                    ({formatValue(toDegrees(pose.data.worldRotation?.x), 1)}°, {formatValue(toDegrees(pose.data.worldRotation?.y), 1)}°, {formatValue(toDegrees(pose.data.worldRotation?.z), 1)}°)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vel:</span>
                  <span className="text-purple-200">
                    ({formatValue(pose.data.velocity?.x, 2)}, {formatValue(pose.data.velocity?.y, 2)}, {formatValue(pose.data.velocity?.z, 2)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Speed:</span>
                  <span className="text-purple-200">{formatValue(pose.data.speed, 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ang Vel:</span>
                  <span className="text-purple-200">{formatValue(toDegrees(pose.data.angularSpeed), 1)}°/s</span>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TelemetryPanel;
