import React from 'react';
import { RaisedHand } from '../types';

interface RaisedHandsPanelProps {
  raisedHands: RaisedHand[];
  onInvite: (hand: RaisedHand) => void;
  onDismiss: (handId: string) => void;
  disabled?: boolean;
}

export const RaisedHandsPanel: React.FC<RaisedHandsPanelProps> = ({
  raisedHands,
  onInvite,
  onDismiss,
  disabled = false,
}) => {
  const pendingHands = raisedHands.filter(h => h.status === 'pending');

  if (pendingHands.length === 0) return null;

  return (
    <div className="absolute top-20 left-4 z-30 bg-black/90 border border-[#ffff00] p-3 max-w-xs shadow-[0_0_10px_rgba(255,255,0,0.3)]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">✋</span>
        <h3 className="text-[#ffff00] font-bold text-xs uppercase tracking-wider">
          Raised Hands ({pendingHands.length})
        </h3>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {pendingHands.slice(0, 5).map((hand) => (
          <div key={hand.id} className="flex flex-col gap-2 border-b border-white/10 pb-2 last:border-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-sm truncate" style={{ color: hand.color }}>
                {hand.username}
              </span>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => onInvite(hand)}
                  disabled={disabled}
                  className="px-2 py-1 text-xs bg-[#00ffff] text-black font-bold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Invite
                </button>
                <button
                  onClick={() => onDismiss(hand.id)}
                  className="px-2 py-1 text-xs bg-transparent text-gray-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 italic leading-tight">"{hand.reason}"</p>
          </div>
        ))}
      </div>
      {pendingHands.length > 5 && (
        <p className="text-[10px] text-gray-500 mt-2 text-center">
          +{pendingHands.length - 5} more
        </p>
      )}
    </div>
  );
};
