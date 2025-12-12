import React, { useEffect, useState, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { CoHost } from '../types';

interface CoHostWindowProps {
  coHost: CoHost;
  agentId: string;
  onDisconnect: () => void;
}

export const CoHostWindow: React.FC<CoHostWindowProps> = ({
  coHost,
  agentId,
  onDisconnect,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Co-host connected');
    },
    onDisconnect: () => {
      console.log('Co-host disconnected');
    },
    onError: (error) => {
      console.error('Co-host error:', error);
      setErrorMessage(error.message || 'Connection error');
    },
    onMessage: (message) => {
      console.log('Co-host message:', message);
    },
  });

  const { status, isSpeaking } = conversation;

  // Start conversation when component mounts
  useEffect(() => {
    const startConversation = async () => {
      try {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });

        // Start the conversation session
        await conversation.startSession({
          agentId: agentId,
        });
      } catch (error) {
        console.error('Failed to start co-host conversation:', error);
        setErrorMessage('Failed to connect. Check microphone permissions.');
      }
    };

    startConversation();

    // Cleanup on unmount
    return () => {
      conversation.endSession();
    };
  }, [agentId]);

  const handleEndCall = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('Error ending session:', error);
    }
    onDisconnect();
  }, [conversation, onDisconnect]);

  // Determine display status
  const getDisplayStatus = () => {
    if (errorMessage) return 'error';
    if (status === 'connected' && isSpeaking) return 'speaking';
    if (status === 'connected') return 'listening';
    if (status === 'connecting') return 'connecting';
    return 'connecting';
  };

  const displayStatus = getDisplayStatus();

  return (
    <div className="absolute bottom-24 right-4 z-30 w-56 bg-black border-2 border-[#00ffff] shadow-[0_0_20px_rgba(0,255,255,0.4)] overflow-hidden">
      {/* Header */}
      <div className="bg-[#00ffff] px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            displayStatus === 'speaking'
              ? 'bg-green-500 animate-pulse'
              : displayStatus === 'listening'
                ? 'bg-green-600'
                : displayStatus === 'connecting'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-600'
          }`} />
          <span className="text-black font-bold text-xs uppercase tracking-wider">
            Co-Host
          </span>
        </div>
        <button
          onClick={handleEndCall}
          className="text-black hover:text-red-600 font-bold text-lg leading-none"
          title="End co-host session"
        >
          ✕
        </button>
      </div>

      {/* Avatar area */}
      <div className="relative aspect-video bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <img
          src={coHost.avatarUrl}
          alt={coHost.username}
          className={`w-20 h-20 rounded-full border-2 transition-all duration-300 ${
            displayStatus === 'speaking'
              ? 'border-[#00ff00] shadow-[0_0_15px_rgba(0,255,0,0.6)] scale-105'
              : displayStatus === 'listening'
                ? 'border-[#ffff00] shadow-[0_0_10px_rgba(255,255,0,0.4)]'
                : 'border-[#00ffff]'
          }`}
        />

        {/* Status indicator */}
        <div className="absolute bottom-2 left-2">
          {displayStatus === 'connecting' && (
            <div className="flex items-center gap-1 bg-black/80 px-2 py-1 rounded text-[10px] text-yellow-400">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
              Connecting...
            </div>
          )}
          {displayStatus === 'speaking' && (
            <div className="flex items-center gap-1 bg-black/80 px-2 py-1 rounded text-[10px] text-[#00ff00]">
              <div className="w-1.5 h-1.5 bg-[#00ff00] rounded-full animate-pulse" />
              Speaking
            </div>
          )}
          {displayStatus === 'listening' && (
            <div className="flex items-center gap-1 bg-black/80 px-2 py-1 rounded text-[10px] text-[#ffff00]">
              <div className="w-1.5 h-1.5 bg-[#ffff00] rounded-full" />
              Listening
            </div>
          )}
          {displayStatus === 'error' && (
            <div className="flex items-center gap-1 bg-black/80 px-2 py-1 rounded text-[10px] text-red-400">
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
              {errorMessage || 'Error'}
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="p-2 text-center border-t border-[#00ffff]/30">
        <span className="font-bold text-sm" style={{ color: coHost.color }}>
          {coHost.username}
        </span>
        <p className="text-[10px] text-gray-500 mt-0.5">AI Co-Host</p>
      </div>
    </div>
  );
};
