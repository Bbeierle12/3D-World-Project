import React, { useEffect, useMemo, useState } from 'react';
import { debugLogger, LOG_CATEGORIES, LOG_LEVELS } from '../utils/index.js';
import { platform } from '../platform/index.js';

const DEBUG_ITEMS = [
  { key: 'showFootTargets', label: 'Foot Targets' },
  { key: 'showComMarker', label: 'CoM Marker' },
  { key: 'showPlumbLine', label: 'Plumb Line' },
  { key: 'showVelocityArrow', label: 'Velocity Arrow' },
  { key: 'showSupportPolygon', label: 'Support Polygon' },
  { key: 'showComTrail', label: 'CoM Trail' }
];

export function DebugOverlay({
  visible,
  debugFlags,
  poseLock,
  posePresets,
  showTelemetry,
  showPerf,
  rendererInfo,
  rayTraceEnabled,
  cameraSettings,
  onToggleVisible,
  onToggleDebugFlag,
  onScreenshot,
  onResetPosition,
  onResetCamera,
  onResetCameraSettings,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  onClearCustomPresets,
  onTogglePoseLock,
  onClearPoseOverride,
  onToggleTelemetry,
  onTogglePerf,
  onToggleRayTrace,
  onUpdateCameraSetting
}) {
  const presetOptions = useMemo(() => {
    const builtIn = (posePresets?.builtIn || []).map((preset) => ({
      id: `built-in:${preset.name}`,
      label: preset.name,
      preset,
      isCustom: false
    }));
    const custom = (posePresets?.custom || []).map((preset) => ({
      id: `custom:${preset.name}`,
      label: `[Custom] ${preset.name}`,
      preset,
      isCustom: true
    }));
    return [...builtIn, ...custom];
  }, [posePresets]);

  const [selectedPresetId, setSelectedPresetId] = useState(presetOptions[0]?.id || '');
  const [customName, setCustomName] = useState('');
  const [logEntries, setLogEntries] = useState(() => debugLogger.getEntries());
  const [logSettings, setLogSettings] = useState(() => debugLogger.getSettings());
  const [logFilter, setLogFilter] = useState('');
  const [showAllLogs, setShowAllLogs] = useState(false);

  useEffect(() => {
    if (!presetOptions.find((option) => option.id === selectedPresetId)) {
      setSelectedPresetId(presetOptions[0]?.id || '');
    }
  }, [presetOptions, selectedPresetId]);

  useEffect(() => {
    return debugLogger.subscribe((entries, settings) => {
      setLogEntries(entries);
      setLogSettings(settings);
    });
  }, []);

  const selectedOption = presetOptions.find((option) => option.id === selectedPresetId);
  const selectedPreset = selectedOption?.preset;

  const filteredLogs = useMemo(() => {
    if (!logFilter) return logEntries;
    const needle = logFilter.toLowerCase();
    return logEntries.filter((entry) => (
      entry.message.toLowerCase().includes(needle) ||
      entry.category.toLowerCase().includes(needle) ||
      entry.level.toLowerCase().includes(needle)
    ));
  }, [logEntries, logFilter]);

  const visibleLogs = useMemo(() => {
    const slice = showAllLogs ? filteredLogs : filteredLogs.slice(-8);
    return slice.slice().reverse();
  }, [filteredLogs, showAllLogs]);

  const handleExportLogs = () => {
    const content = debugLogger.exportJSON();
    platform.saveTextFile(`debug-logs-${Date.now()}.json`, content);
  };

  if (!visible) {
    return (
      <button
        className="absolute bottom-4 left-4 z-20 rounded-md bg-black/70 px-3 py-2 text-sm text-white"
        onClick={onToggleVisible}
        type="button"
      >
        Debug HUD
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 z-20 w-80 space-y-3 rounded-lg bg-black/80 p-4 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold tracking-wide text-cyan-300">Debug HUD</div>
        <button
          className="rounded border border-white/20 px-2 py-1 text-xs text-white/80 hover:text-white"
          onClick={onToggleVisible}
          type="button"
        >
          Hide
        </button>
      </div>

      <div className="space-y-2 rounded-md border border-white/10 p-3">
        <div className="text-xs font-semibold uppercase text-white/60">Debug Toggles</div>
        <div className="space-y-2 text-sm">
          {DEBUG_ITEMS.map((item) => (
            <label key={item.key} className="flex items-center justify-between">
              <span>{item.label}</span>
              <input
                checked={Boolean(debugFlags?.[item.key])}
                className="h-4 w-4 accent-cyan-400"
                onChange={() => onToggleDebugFlag(item.key)}
                type="checkbox"
              />
            </label>
          ))}
          <label className="flex items-center justify-between">
            <span>Show Telemetry</span>
            <input
              checked={Boolean(showTelemetry)}
              className="h-4 w-4 accent-cyan-400"
              onChange={onToggleTelemetry}
              type="checkbox"
            />
          </label>
        </div>
      </div>

      <div className="space-y-2 rounded-md border border-white/10 p-3">
        <div className="text-xs font-semibold uppercase text-white/60">Pose Presets</div>
        <div className="space-y-2 text-sm">
          <select
            className="w-full rounded border border-white/10 bg-black/50 px-2 py-1 text-sm text-white"
            onChange={(event) => setSelectedPresetId(event.target.value)}
            value={selectedPresetId}
          >
            {presetOptions.length === 0 && (
              <option value="">No presets</option>
            )}
            {presetOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              className="flex-1 rounded bg-cyan-600 px-2 py-1 text-xs font-semibold text-black"
              onClick={() => onApplyPreset(selectedPreset)}
              type="button"
            >
              Apply
            </button>
            <button
              className="flex-1 rounded border border-white/20 px-2 py-1 text-xs"
              onClick={onTogglePoseLock}
              type="button"
            >
              {poseLock ? 'Unlock Pose' : 'Lock Pose'}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              className="flex-1 rounded border border-white/20 px-2 py-1 text-xs"
              onClick={onClearPoseOverride}
              type="button"
            >
              Clear Override
            </button>
            <button
              className="flex-1 rounded border border-white/20 px-2 py-1 text-xs disabled:opacity-50"
              disabled={!selectedOption?.isCustom}
              onClick={() => selectedOption?.isCustom && onDeletePreset(selectedPreset?.name)}
              type="button"
            >
              Delete Custom
            </button>
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 rounded border border-white/10 bg-black/50 px-2 py-1 text-xs text-white"
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Preset name"
              type="text"
              value={customName}
            />
            <button
              className="rounded bg-white/10 px-2 py-1 text-xs"
              onClick={() => {
                if (!customName.trim()) return;
                onSavePreset(customName);
                setCustomName('');
              }}
              type="button"
            >
              Save
            </button>
          </div>

          <button
            className="w-full rounded border border-white/20 px-2 py-1 text-xs"
            onClick={onClearCustomPresets}
            type="button"
          >
            Clear Custom Presets
          </button>
        </div>
      </div>

      <div className="space-y-2 rounded-md border border-white/10 p-3">
        <div className="text-xs font-semibold uppercase text-white/60">Actions</div>
        <div className="flex gap-2 text-xs">
          <button
            className="flex-1 rounded bg-white/10 px-2 py-1"
            onClick={onScreenshot}
            type="button"
          >
            Screenshot
          </button>
          <button
            className="flex-1 rounded bg-white/10 px-2 py-1"
            onClick={onResetPosition}
            type="button"
          >
            Reset Location
          </button>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            className="flex-1 rounded bg-white/10 px-2 py-1"
            onClick={onResetCamera}
            type="button"
          >
            Reset Camera
          </button>
          <button
            className="flex-1 rounded bg-white/10 px-2 py-1"
            onClick={onResetCameraSettings}
            type="button"
          >
            Reset Camera Settings
          </button>
        </div>
      </div>

      <div className="space-y-2 rounded-md border border-white/10 p-3">
        <div className="text-xs font-semibold uppercase text-white/60">Camera</div>
        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between">
            <span>Invert X</span>
            <input
              checked={Boolean(cameraSettings?.invertX)}
              className="h-4 w-4 accent-cyan-400"
              onChange={(event) => onUpdateCameraSetting('invertX', event.target.checked)}
              type="checkbox"
            />
          </label>

          <label className="flex items-center justify-between">
            <span>Invert Y</span>
            <input
              checked={Boolean(cameraSettings?.invertY)}
              className="h-4 w-4 accent-cyan-400"
              onChange={(event) => onUpdateCameraSetting('invertY', event.target.checked)}
              type="checkbox"
            />
          </label>

          <label className="flex items-center justify-between">
            <span>Invert Zoom</span>
            <input
              checked={Boolean(cameraSettings?.invertZoom)}
              className="h-4 w-4 accent-cyan-400"
              onChange={(event) => onUpdateCameraSetting('invertZoom', event.target.checked)}
              type="checkbox"
            />
          </label>

          <label className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Rotate Speed</span>
              <span>{cameraSettings?.rotateSpeed?.toFixed(4)}</span>
            </div>
            <input
              className="w-full"
              max="0.02"
              min="0.001"
              onChange={(event) => onUpdateCameraSetting('rotateSpeed', parseFloat(event.target.value))}
              step="0.001"
              type="range"
              value={cameraSettings?.rotateSpeed ?? 0}
            />
          </label>

          <label className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Zoom Speed</span>
              <span>{cameraSettings?.zoomSpeed?.toFixed(4)}</span>
            </div>
            <input
              className="w-full"
              max="0.01"
              min="0.0005"
              onChange={(event) => onUpdateCameraSetting('zoomSpeed', parseFloat(event.target.value))}
              step="0.0005"
              type="range"
              value={cameraSettings?.zoomSpeed ?? 0}
            />
          </label>

          <label className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Pan Speed</span>
              <span>{cameraSettings?.panSpeed?.toFixed(3)}</span>
            </div>
            <input
              className="w-full"
              max="0.05"
              min="0.001"
              onChange={(event) => onUpdateCameraSetting('panSpeed', parseFloat(event.target.value))}
              step="0.001"
              type="range"
              value={cameraSettings?.panSpeed ?? 0}
            />
          </label>

          <label className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Min Distance</span>
              <span>{cameraSettings?.minDistance?.toFixed(1)}</span>
            </div>
            <input
              className="w-full"
              max="50"
              min="2"
              onChange={(event) => onUpdateCameraSetting('minDistance', parseFloat(event.target.value))}
              step="0.5"
              type="range"
              value={cameraSettings?.minDistance ?? 0}
            />
          </label>

          <label className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Max Distance</span>
              <span>{cameraSettings?.maxDistance?.toFixed(1)}</span>
            </div>
            <input
              className="w-full"
              max="100"
              min="5"
              onChange={(event) => onUpdateCameraSetting('maxDistance', parseFloat(event.target.value))}
              step="0.5"
              type="range"
              value={cameraSettings?.maxDistance ?? 0}
            />
          </label>

          <label className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Min Pitch</span>
              <span>{cameraSettings?.minPitch?.toFixed(2)}</span>
            </div>
            <input
              className="w-full"
              max={Math.PI / 2 - 0.05}
              min="0.05"
              onChange={(event) => onUpdateCameraSetting('minPitch', parseFloat(event.target.value))}
              step="0.01"
              type="range"
              value={cameraSettings?.minPitch ?? 0}
            />
          </label>

          <label className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Max Pitch</span>
              <span>{cameraSettings?.maxPitch?.toFixed(2)}</span>
            </div>
            <input
              className="w-full"
              max={Math.PI / 2 - 0.05}
              min="0.2"
              onChange={(event) => onUpdateCameraSetting('maxPitch', parseFloat(event.target.value))}
              step="0.01"
              type="range"
              value={cameraSettings?.maxPitch ?? 0}
            />
          </label>

          <label className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Rotation Lerp</span>
              <span>{cameraSettings?.rotationLerp?.toFixed(2)}</span>
            </div>
            <input
              className="w-full"
              max="0.5"
              min="0.01"
              onChange={(event) => onUpdateCameraSetting('rotationLerp', parseFloat(event.target.value))}
              step="0.01"
              type="range"
              value={cameraSettings?.rotationLerp ?? 0}
            />
          </label>

          <label className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Position Lerp</span>
              <span>{cameraSettings?.positionLerp?.toFixed(2)}</span>
            </div>
            <input
              className="w-full"
              max="0.5"
              min="0.01"
              onChange={(event) => onUpdateCameraSetting('positionLerp', parseFloat(event.target.value))}
              step="0.01"
              type="range"
              value={cameraSettings?.positionLerp ?? 0}
            />
          </label>

          <label className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Zoom Lerp</span>
              <span>{cameraSettings?.zoomLerp?.toFixed(2)}</span>
            </div>
            <input
              className="w-full"
              max="0.5"
              min="0.01"
              onChange={(event) => onUpdateCameraSetting('zoomLerp', parseFloat(event.target.value))}
              step="0.01"
              type="range"
              value={cameraSettings?.zoomLerp ?? 0}
            />
          </label>
        </div>
      </div>

      <div className="space-y-2 rounded-md border border-white/10 p-3">
        <div className="text-xs font-semibold uppercase text-white/60">Render</div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-white/70">
            <span>Backend</span>
            <span className="text-cyan-300">{rendererInfo?.backend ?? 'unknown'}</span>
          </div>
          <div className="flex items-center justify-between text-white/70">
            <span>WebGPU Support</span>
            <span className={rendererInfo?.supportsWebGPU ? 'text-green-300' : 'text-red-300'}>
              {rendererInfo?.supportsWebGPU ? 'Yes' : 'No'}
            </span>
          </div>
          {rendererInfo?.fallbackUsed && (
            <div className="text-yellow-300">Fallback active</div>
          )}
          <label className="flex items-center justify-between">
            <span>Show Perf</span>
            <input
              checked={Boolean(showPerf)}
              className="h-4 w-4 accent-cyan-400"
              onChange={onTogglePerf}
              type="checkbox"
            />
          </label>
          <label className="flex items-center justify-between">
            <span>Ray Trace Preview</span>
            <input
              checked={Boolean(rayTraceEnabled)}
              className="h-4 w-4 accent-cyan-400"
              onChange={onToggleRayTrace}
              type="checkbox"
            />
          </label>
        </div>
      </div>

      <div className="space-y-2 rounded-md border border-white/10 p-3">
        <div className="text-xs font-semibold uppercase text-white/60">Logging</div>
        <div className="space-y-2 text-xs">
          <label className="flex items-center justify-between">
            <span>Enabled</span>
            <input
              checked={Boolean(logSettings?.enabled)}
              className="h-4 w-4 accent-cyan-400"
              onChange={(event) => debugLogger.setEnabled(event.target.checked)}
              type="checkbox"
            />
          </label>

          <label className="flex items-center justify-between">
            <span>Min Level</span>
            <select
              className="rounded border border-white/10 bg-black/50 px-2 py-1 text-xs text-white"
              onChange={(event) => {
                const nextLevel = event.target.value;
                if (LOG_LEVELS.includes(nextLevel)) {
                  debugLogger.setMinLevel(nextLevel);
                }
              }}
              value={logSettings?.minLevel ?? 'debug'}
            >
              {LOG_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center justify-between">
            <span>Max Entries</span>
            <input
              className="w-20 rounded border border-white/10 bg-black/50 px-2 py-1 text-xs text-white"
              min="50"
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                if (Number.isFinite(nextValue)) {
                  debugLogger.setMaxEntries(nextValue);
                }
              }}
              type="number"
              value={logSettings?.maxEntries ?? 500}
            />
          </label>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {LOG_CATEGORIES.map((category) => (
              <label key={category} className="flex items-center justify-between">
                <span>{category}</span>
                <input
                  checked={Boolean(logSettings?.categories?.[category])}
                  className="h-3 w-3 accent-cyan-400"
                  onChange={(event) => debugLogger.setCategoryEnabled(category, event.target.checked)}
                  type="checkbox"
                />
              </label>
            ))}
          </div>

          <input
            className="w-full rounded border border-white/10 bg-black/50 px-2 py-1 text-xs text-white"
            onChange={(event) => setLogFilter(event.target.value)}
            placeholder="Filter logs"
            type="text"
            value={logFilter}
          />

          <div className="flex gap-2">
            <button
              className="flex-1 rounded bg-white/10 px-2 py-1"
              onClick={() => debugLogger.clear()}
              type="button"
            >
              Clear
            </button>
            <button
              className="flex-1 rounded bg-white/10 px-2 py-1"
              onClick={handleExportLogs}
              type="button"
            >
              Export JSON
            </button>
            <button
              className="flex-1 rounded bg-white/10 px-2 py-1"
              onClick={() => setShowAllLogs((prev) => !prev)}
              type="button"
            >
              {showAllLogs ? 'Recent' : 'Show All'}
            </button>
          </div>

          <div className="max-h-40 space-y-1 overflow-auto rounded border border-white/10 bg-black/40 p-2 text-[11px]">
            {visibleLogs.length === 0 && (
              <div className="text-white/60">No logs yet.</div>
            )}
            {visibleLogs.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-white/70">
                  <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <span className="uppercase">{entry.level}</span>
                </div>
                <div className="text-white/90">
                  <span className="text-cyan-300">[{entry.category}]</span> {entry.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DebugOverlay;
