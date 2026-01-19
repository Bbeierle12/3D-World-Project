import React from 'react';

/**
 * Quick action buttons for common controls
 */
export function QuickActions({ onResetPosition, onResetCamera, onScreenshot }) {
  return (
    <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 rounded-lg bg-black/70 p-3 text-xs text-white shadow-lg">
      <button
        className="rounded border border-white/20 px-2 py-1 text-left hover:border-white/40"
        onClick={onResetPosition}
        type="button"
      >
        Reset Location <span className="text-white/60">(L)</span>
      </button>
      <button
        className="rounded border border-white/20 px-2 py-1 text-left hover:border-white/40"
        onClick={onResetCamera}
        type="button"
      >
        Reset Camera <span className="text-white/60">(R)</span>
      </button>
      <button
        className="rounded border border-white/20 px-2 py-1 text-left hover:border-white/40"
        onClick={onScreenshot}
        type="button"
      >
        Screenshot <span className="text-white/60">(P)</span>
      </button>
    </div>
  );
}

export default QuickActions;
