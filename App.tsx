import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './components/Button';
import { ChatStream } from './components/ChatStream';
import { StreamOverlay } from './components/StreamOverlay';
import { RaisedHandsPanel } from './components/RaisedHandsPanel';
import { CoHostWindow } from './components/CoHostWindow';
import { generateLiveComments, generateSummary } from './services/geminiService';
import { createCoHostAgent, COHOST_SYSTEM_PROMPT, COHOST_VOICES } from './services/elevenLabsService';
import { Comment, StreamStatus, SummaryStyle, RaisedHand, CoHost } from './types';
import { getRandomColor, blobToBase64 } from './utils';

const App: React.FC = () => {
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [comments, setComments] = useState<Comment[]>([]);
  
  // Video Recording State
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videoMimeType, setVideoMimeType] = useState<string>('video/webm');
  
  // Audio Recording State (For faster summary generation)
  const [audioRecordedChunks, setAudioRecordedChunks] = useState<Blob[]>([]);

  const [summary, setSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [selectedSummaryStyle, setSelectedSummaryStyle] = useState<SummaryStyle>(SummaryStyle.CASUAL);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Raised Hands & Co-Host State
  const [raisedHands, setRaisedHands] = useState<RaisedHand[]>([]);
  const [coHost, setCoHost] = useState<CoHost | null>(null);
  const [coHostAgentId, setCoHostAgentId] = useState<string | null>(null);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  
  // Ref for audio chunk processing interval (Live Comments)
  const audioIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const audioChunksBufferRef = useRef<Float32Array[]>([]);

  // Ref to track coHost state for closure access
  const coHostRef = useRef<CoHost | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    coHostRef.current = coHost;
  }, [coHost]);

  // Ref to always have the latest fetchComments function
  const fetchCommentsRef = useRef<((audioBase64: string) => Promise<void>) | null>(null);

  // Initialize Camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
      } catch (err) {
        setError("Camera/Microphone access denied. Please enable permissions.");
      }
    };
    initCamera();
    
    // Clean up
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      stopProcessingAudio();
    };
  }, []);

  const startStream = () => {
    if (!streamRef.current) return;

    setStatus('streaming');
    setComments([]);
    setRecordedChunks([]);
    setAudioRecordedChunks([]);
    setSummary('');
    setIsCopied(false);
    setRaisedHands([]);
    setCoHost(null);
    setCoHostAgentId(null);

    // 1. Setup Video Recorder
    // Prioritize MP4 with H264 for best compatibility if supported
    let vMimeType = 'video/webm';
    if (MediaRecorder.isTypeSupported('video/mp4; codecs=h264,aac')) {
        vMimeType = 'video/mp4; codecs=h264,aac';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        vMimeType = 'video/mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
        vMimeType = 'video/webm; codecs=vp9';
    }
    setVideoMimeType(vMimeType);

    const recorder = new MediaRecorder(streamRef.current, { mimeType: vMimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setRecordedChunks((prev) => [...prev, e.data]);
      }
    };
    recorder.start(1000); 
    mediaRecorderRef.current = recorder;

    // 2. Setup Audio-Only Recorder (For faster Gemini Summaries)
    try {
        const audioTrackStream = new MediaStream(streamRef.current.getAudioTracks());
        // Optimize for size/speed - lower bitrate (32kbps) is sufficient for speech summary
        const aRecorder = new MediaRecorder(audioTrackStream, {
            bitsPerSecond: 32000
        });
        aRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                setAudioRecordedChunks((prev) => [...prev, e.data]);
            }
        };
        aRecorder.start(1000);
        audioRecorderRef.current = aRecorder;
    } catch (e) {
        console.warn("Could not start separate audio recorder, falling back to video for summary if needed.", e);
    }

    // 3. Setup Raw Audio Processing for Live Comments
    startProcessingAudio();
  };

  const stopStream = () => {
    setStatus('ended');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
        audioRecorderRef.current.stop();
    }
    stopProcessingAudio();
  };

  // --- Audio Processing Logic for Live Comments ---
  const startProcessingAudio = () => {
    if (!streamRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    const source = audioContext.createMediaStreamSource(streamRef.current);
    sourceNodeRef.current = source;
    
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorNodeRef.current = processor;

    processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        audioChunksBufferRef.current.push(new Float32Array(inputData));
    };

    source.connect(processor);
    processor.connect(audioContext.destination);

    audioIntervalRef.current = window.setInterval(async () => {
        if (audioChunksBufferRef.current.length === 0) return;

        const totalLength = audioChunksBufferRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of audioChunksBufferRef.current) {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        audioChunksBufferRef.current = [];

        const wavBlob = encodeWAV(result, audioContext.sampleRate);
        const base64 = await blobToBase64(wavBlob);

        // Use ref to always call latest version of fetchComments
        if (fetchCommentsRef.current) {
            fetchCommentsRef.current(base64);
        }

    }, 4000);
  };

  const stopProcessingAudio = () => {
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    if (processorNodeRef.current) processorNodeRef.current.disconnect();
    if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    audioChunksBufferRef.current = [];
  };

  const encodeWAV = (samples: Float32Array, sampleRate: number): Blob => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
      for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
    };
    floatTo16BitPCM(view, 44, samples);
    return new Blob([view], { type: 'audio/wav' });
  };


  const fetchComments = async (audioBase64: string) => {
    const newCommentsData = await generateLiveComments(audioBase64);
    if (newCommentsData && newCommentsData.length > 0) {
        newCommentsData.forEach((c, index) => {
            setTimeout(() => {
                const color = getRandomColor();
                const newComment: Comment = {
                    ...c,
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    color
                };

                setComments(prev => [...prev, newComment]);

                // If comment includes raised hand and no active co-host, add to raisedHands
                if (c.wantsToRaiseHand && c.raiseHandReason && !coHostRef.current) {
                    setRaisedHands(prev => [...prev, {
                        id: crypto.randomUUID(),
                        username: c.username,
                        reason: c.raiseHandReason || 'Would like to join the conversation',
                        timestamp: Date.now(),
                        color,
                        status: 'pending'
                    }]);
                }
            }, index * 800 + Math.random() * 500);
        });
    }
  };

  // Keep fetchComments ref updated
  useEffect(() => {
    fetchCommentsRef.current = fetchComments;
  });

  // --- Raised Hands & Co-Host Handlers ---

  const handleInviteCoHost = async (hand: RaisedHand) => {
    setIsCreatingAgent(true);

    try {
      const agentId = await createCoHostAgent({
        name: `CoHost_${hand.username}_${Date.now()}`,
        systemPrompt: COHOST_SYSTEM_PROMPT + `\n\nYour name is ${hand.username}. You raised your hand because: "${hand.reason}"`,
        firstMessage: `Hey! Thanks for having me on. I raised my hand because ${hand.reason}`,
        voiceId: COHOST_VOICES[Math.floor(Math.random() * COHOST_VOICES.length)].id,
      });

      setCoHostAgentId(agentId);
      setCoHost({
        username: hand.username,
        color: hand.color,
        status: 'connecting',
        avatarUrl: `https://api.dicebear.com/7.x/personas/svg?seed=${hand.username}`,
      });

      setRaisedHands(prev =>
        prev.map(h => h.id === hand.id ? { ...h, status: 'invited' as const } : h)
      );
    } catch (error) {
      console.error('Failed to create co-host agent:', error);
      setError('Failed to invite co-host. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const handleDismissHand = (handId: string) => {
    setRaisedHands(prev => prev.filter(h => h.id !== handId));
  };

  const handleCoHostDisconnect = () => {
    setCoHost(null);
    setCoHostAgentId(null);
  };

  // --- Post Stream Actions ---

  const handleDownloadVideo = () => {
    const blob = new Blob(recordedChunks, { type: videoMimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    
    // Determine extension based on mimetype
    const ext = videoMimeType.includes('mp4') ? 'mp4' : 'webm';
    a.download = `liveroom-stream-${new Date().toISOString()}.${ext}`;
    
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    // Use audio chunks for summary if available (much faster upload), otherwise fallback to video
    let blob: Blob;
    if (audioRecordedChunks.length > 0) {
         // Default to audio/webm or whatever browser uses for audio recording
        blob = new Blob(audioRecordedChunks, { type: 'audio/webm' });
    } else {
        blob = new Blob(recordedChunks, { type: videoMimeType });
    }
    
    const result = await generateSummary(blob, selectedSummaryStyle);
    setSummary(result);
    setIsGeneratingSummary(false);
  };

  const handleCopySummary = async () => {
    try {
        await navigator.clipboard.writeText(summary);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
        console.error("Failed to copy text", err);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 md:p-8">
      {/* Header / Brand */}
      <header className="absolute top-4 left-6 z-50">
        <h1 className="glitch-text font-['Syncopate'] text-4xl md:text-5xl font-bold tracking-tighter" data-text="LIVEROOM">
          LIVEROOM
        </h1>
        <p className="text-[#00ffff] text-xs font-mono tracking-[0.3em] uppercase mt-1">
          Simulated Streaming Environment
        </p>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-7xl h-[80vh] flex flex-col md:flex-row gap-4 relative mt-12 md:mt-0">
        
        {/* Left Col: Camera Feed */}
        <div className="flex-1 relative border-2 border-white/20 bg-gray-900 overflow-hidden shadow-[0_0_20px_rgba(0,255,255,0.2)] group">
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 p-4 text-center">
                <p className="text-red-500 font-mono">{error}</p>
            </div>
          )}
          
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]" 
          />
          
          {/* Glitch Overlay Effects */}
          <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] bg-cover mix-blend-screen" />
          <div className="absolute inset-0 border-[0.5px] border-white/5 pointer-events-none" />

          {status === 'streaming' && (
            <>
              <StreamOverlay
                raisedHandsCount={raisedHands.filter(h => h.status === 'pending').length}
                hasCoHost={!!coHost}
              />

              {/* Raised Hands Panel */}
              <RaisedHandsPanel
                raisedHands={raisedHands}
                onInvite={handleInviteCoHost}
                onDismiss={handleDismissHand}
                disabled={isCreatingAgent || !!coHost}
              />

              {/* Co-Host Window */}
              {coHost && coHostAgentId && (
                <CoHostWindow
                  coHost={coHost}
                  agentId={coHostAgentId}
                  onDisconnect={handleCoHostDisconnect}
                />
              )}
            </>
          )}

          {/* Controls Overlay (Bottom of Video) */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/50 to-transparent flex justify-center gap-4 transition-transform duration-300 translate-y-2 group-hover:translate-y-0">
             {status === 'idle' && (
               <Button label="Start Stream" onClick={startStream} />
             )}
             {status === 'streaming' && (
               <Button label="End Stream" variant="danger" onClick={stopStream} />
             )}
             {status === 'ended' && (
                <div className="flex gap-4">
                    <Button label="Reset" variant="secondary" onClick={() => {
                        setStatus('idle');
                        setSummary('');
                    }} />
                    <Button label="Download Video" onClick={handleDownloadVideo} />
                </div>
             )}
          </div>
        </div>

        {/* Right Col: Interaction / Comments */}
        <div className="w-full md:w-96 flex flex-col gap-4 h-full">
            
            {/* Comment Section Container */}
            <div className={`flex-1 border-2 border-[#ff00ff] bg-black/80 relative flex flex-col overflow-hidden shadow-[4px_4px_0px_rgba(255,0,255,0.5)] transition-all duration-500 ${status === 'ended' && !summary ? 'opacity-50 blur-[1px]' : 'opacity-100'}`}>
                <div className="bg-[#ff00ff] p-1 text-center">
                    <h2 className="text-black font-bold text-xs uppercase tracking-widest">Live Chat</h2>
                </div>
                <div className="flex-1 overflow-hidden relative">
                    <ChatStream comments={comments} />
                </div>
            </div>

            {/* Post-Stream Summary Panel */}
            {status === 'ended' && (
                <div className="absolute inset-0 md:static md:inset-auto z-50 md:z-auto bg-black/95 md:bg-transparent flex flex-col gap-2 p-4 md:p-0 md:h-1/2 animate-in fade-in slide-in-from-bottom-4">
                     <div className="border border-[#00ffff] bg-black p-4 h-full flex flex-col gap-4 shadow-[4px_4px_0px_#00ffff]">
                        <h3 className="text-[#00ffff] font-bold text-sm uppercase">Generate Summary</h3>
                        
                        {!summary ? (
                            <div className="flex flex-col gap-3">
                                <label className="text-xs text-gray-400">Select Style</label>
                                <div className="flex flex-col gap-2">
                                    {(Object.values(SummaryStyle) as SummaryStyle[]).map((style) => (
                                        <button
                                            key={style}
                                            onClick={() => setSelectedSummaryStyle(style)}
                                            className={`text-left text-xs px-3 py-2 border ${selectedSummaryStyle === style ? 'bg-white text-black border-white' : 'text-gray-400 border-gray-800 hover:border-gray-500'}`}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                                <Button 
                                    label={isGeneratingSummary ? "Generating..." : "Generate Text"} 
                                    onClick={handleGenerateSummary} 
                                    disabled={isGeneratingSummary}
                                    variant="secondary"
                                    className="w-full mt-2"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="flex-1 overflow-y-auto text-xs text-gray-300 font-mono p-2 border border-white/10 mb-2">
                                    <pre className="whitespace-pre-wrap font-inherit">{summary}</pre>
                                </div>
                                <Button 
                                    label={isCopied ? "COPIED!" : "Copy text"} 
                                    onClick={handleCopySummary} 
                                    className={`w-full text-xs !normal-case ${isCopied ? 'bg-green-500 border-green-500 text-black' : ''}`} 
                                />
                            </div>
                        )}
                     </div>
                </div>
            )}

        </div>
      </main>
      
      {/* Decorative Grid Background */}
      <div className="fixed inset-0 pointer-events-none -z-10" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }} 
      />
    </div>
  );
};

export default App;