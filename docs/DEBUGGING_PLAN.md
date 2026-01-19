# Debugging and Logging Plan

## Goals
- Capture reproducible signals for physics, input, animation, and rendering issues.
- Provide lightweight, searchable logs with optional exports.
- Keep logging opt-in and configurable per category and level.

## Near-Term Additions
- Input: log binding changes, missed inputs, and conflict detection.
- Physics: log contact events, grounding changes, and collision pairs.
- Camera: record major mode changes and clamped values.
- Rendering: track backend selection, fallback events, and frame pacing spikes.

## Instrumentation Targets
- Character controller state transitions with timestamps.
- IK solve errors or non-convergence cases.
- Rapier step timings and step sub-iterations.
- WebGPU availability and device limits (once available via API).

## Data Handling
- Ring buffer defaults with export to JSON.
- Optional sampling mode for high-frequency categories.
- Persisted settings to avoid reconfiguring on each session.

## Future Scope
- Deterministic input replay for bug reproduction.
- Performance capture snapshots (fps, frame time, GPU timings).
- Crash boundary log dump on uncaught errors.
