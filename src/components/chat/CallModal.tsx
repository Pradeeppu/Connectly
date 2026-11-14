import React, { useEffect, useRef } from 'react';
import { useCallStore } from '../../stores/callStore';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  User,
} from 'lucide-react';

export const CallModal: React.FC = () => {
  const {
    callStatus,
    caller,
    callee,
    isVideo,
    isMuted,
    isVideoOff,
    localStream,
    remoteStream,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCallStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callStatus === 'idle') return null;

  // Incoming Call Ringing Overlay
  if (callStatus === 'ringing') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-sm p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400 animate-pulse">
            {isVideo ? <Video className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Incoming {isVideo ? 'Video' : 'Audio'} Call</h3>
            <p className="text-xs text-zinc-400 mt-1">
              <strong className="text-zinc-200">@{caller?.nickname || 'Friend'}</strong> is calling you...
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={declineCall}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/30"
            >
              <PhoneOff className="w-4 h-4" />
              Decline
            </button>
            <button
              onClick={answerCall}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/30"
            >
              <Phone className="w-4 h-4" />
              Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active / Calling Window
  const targetName = callee?.nickname || caller?.nickname || 'Friend';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wide">
              {callStatus === 'calling' ? `Calling @${targetName}...` : `In Call with @${targetName}`}
            </span>
          </div>
        </div>

        {/* Video Stage */}
        <div className="flex-1 relative bg-zinc-900 flex items-center justify-center overflow-hidden">
          {isVideo ? (
            <>
              {/* Remote Video Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Local Video Stream Picture-in-Picture */}
              <div className="absolute bottom-20 right-4 w-32 sm:w-44 aspect-video rounded-xl overflow-hidden border-2 border-zinc-700 bg-zinc-950 shadow-xl z-10">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500 text-xs">
                    Camera Off
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Audio-only Avatar Stage */
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-sky-400 shadow-2xl">
                <User className="w-12 h-12" />
              </div>
              <h2 className="text-lg font-bold text-white">@{targetName}</h2>
              <p className="text-xs text-zinc-400">Audio Call Connected</p>
            </div>
          )}
        </div>

        {/* Call Controls Floating Bar */}
        <div className="absolute bottom-4 inset-x-0 z-20 flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-3.5 rounded-2xl transition cursor-pointer shadow-lg ${
              isMuted
                ? 'bg-rose-600 text-white'
                : 'bg-zinc-800/90 hover:bg-zinc-700 text-white border border-zinc-700/60'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {isVideo && (
            <button
              onClick={toggleVideo}
              className={`p-3.5 rounded-2xl transition cursor-pointer shadow-lg ${
                isVideoOff
                  ? 'bg-rose-600 text-white'
                  : 'bg-zinc-800/90 hover:bg-zinc-700 text-white border border-zinc-700/60'
              }`}
              title={isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={endCall}
            className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer shadow-lg shadow-rose-600/30 flex items-center justify-center"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
