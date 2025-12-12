import React, { useEffect, useRef } from 'react';
import { Comment } from '../types';

interface ChatStreamProps {
  comments: Comment[];
}

export const ChatStream: React.FC<ChatStreamProps> = ({ comments }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  return (
    <div className="h-full flex flex-col justify-end overflow-hidden relative">
        {/* Gradient overlay to fade top messages */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />

      <div className="overflow-y-auto px-4 py-2 space-y-3 custom-scrollbar max-h-full">
        {comments.map((comment) => (
          <div 
            key={comment.id} 
            className={`animate-fade-in-up flex flex-col items-start opacity-90 hover:opacity-100 transition-opacity`}
          >
            <div className="flex items-baseline gap-2">
                <span className="font-bold text-xs tracking-wider" style={{ color: comment.color }}>
                    {comment.username}
                </span>
                <span className="text-[10px] text-gray-500 uppercase">
                    {new Date(comment.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                </span>
            </div>
            <p className={`text-sm break-words leading-tight ${comment.isQuestion ? 'text-[#ffff00] font-semibold' : 'text-white'}`}>
                {comment.text}
            </p>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};
