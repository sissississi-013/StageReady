import React, { useEffect, useState } from 'react';

interface StreamOverlayProps {
  raisedHandsCount?: number;
  hasCoHost?: boolean;
}

export const StreamOverlay: React.FC<StreamOverlayProps> = ({
  raisedHandsCount = 0,
  hasCoHost = false,
}) => {
  const [viewers, setViewers] = useState(120);

  useEffect(() => {
    const interval = setInterval(() => {
      // Random walk for viewer count
      setViewers(prev => Math.max(0, prev + Math.floor(Math.random() * 7) - 3));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-20">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-black/80 px-3 py-1 border border-[#ff00ff]">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_#ff0000]" />
          <span className="text-red-500 font-bold tracking-wider text-sm">LIVE</span>
        </div>
        <div className="bg-black/80 px-3 py-1 border border-[#00ffff] w-fit">
           <span className="text-[#00ffff] font-mono text-xs tracking-widest">{viewers} watching</span>
        </div>
        {raisedHandsCount > 0 && (
          <div className="bg-black/80 px-3 py-1 border border-[#ffff00] w-fit animate-pulse">
            <span className="text-[#ffff00] font-mono text-xs tracking-widest">
              ✋ {raisedHandsCount} raised
            </span>
          </div>
        )}
        {hasCoHost && (
          <div className="bg-black/80 px-3 py-1 border border-[#00ff00] w-fit">
            <span className="text-[#00ff00] font-mono text-xs tracking-widest">
              🎙️ Co-hosting
            </span>
          </div>
        )}
      </div>

      <div className="bg-black/80 p-2 border border-white/20">
        <div className="text-[10px] text-white/50 font-mono">REC ●</div>
      </div>
    </div>
  );
};
