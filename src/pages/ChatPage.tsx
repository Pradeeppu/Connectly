import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchStore } from '../stores/matchStore';
import { useAuthStore } from '../stores/authStore';
import { useCallStore } from '../stores/callStore';
import { useFriendStore } from '../stores/friendStore';
import { ReportModal } from '../features/moderation/ReportModal';
import { BlockModal } from '../features/moderation/BlockModal';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Send,
  Flag,
  Ban,
  RotateCw,
  Loader2,
  AlertCircle,
  Paperclip,
  Image as ImageIcon,
  X,
  UserPlus,
  Phone,
  Video,
  Check,
} from 'lucide-react';

export const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const {
    status,
    partner,
    messages,
    partnerTyping,
    incomingFriendRequest,
    startMatchmaking,
    leaveMatch,
    nextMatch,
    sendMessage,
    sendTyping,
    sendFriendRequestSignal,
    respondFriendRequestSignal,
  } = useMatchStore();

  const { startCall } = useCallStore();
  const { sendFriendRequest } = useFriendStore();

  const [input, setInput] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [stopConfirm, setStopConfirm] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [isFriendConnected, setIsFriendConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  useEffect(() => {
    if (!profile) {
      navigate('/');
    } else if (status === 'idle') {
      startMatchmaking(profile);
    }
  }, [profile, status, navigate, startMatchmaking]);

  useEffect(() => {
    setStopConfirm(false);
    setFriendRequestSent(false);
    setIsFriendConnected(false);
    setSelectedMedia(null);
    if (status === 'matched') {
      inputRef.current?.focus();
    }
  }, [status]);

  // Global Keyboard Shortcuts (Esc to stop / new, Enter to send)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (status === 'matched') {
          if (!stopConfirm) {
            setStopConfirm(true);
          } else {
            leaveMatch();
            setStopConfirm(false);
          }
        } else if (status === 'ended' || status === 'idle') {
          if (profile) nextMatch(profile);
        }
      }
    };

    const handleUnload = () => {
      leaveMatch();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [status, stopConfirm, profile, leaveMatch, nextMatch]);

  const handleStopClick = () => {
    if (status === 'matched') {
      if (!stopConfirm) {
        setStopConfirm(true);
      } else {
        leaveMatch();
        setStopConfirm(false);
      }
    } else if (status === 'ended' || status === 'idle') {
      if (profile) nextMatch(profile);
    } else if (status === 'searching') {
      leaveMatch();
      navigate('/');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    sendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 1500);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    const isImage = file.type.startsWith('image');
    if (!isImage && !isVideo) {
      alert('Please select an image or video file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('File size must be under 20MB');
      return;
    }

    // Upload directly to Supabase Storage bucket 'chat-media'
    const fileExt = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    if (isSupabaseConfigured) {
      try {
        const { error: uploadErr } = await supabase.storage.from('chat-media').upload(fileName, file);
        if (!uploadErr) {
          const { data: pubData } = supabase.storage.from('chat-media').getPublicUrl(fileName);
          setSelectedMedia({
            url: pubData.publicUrl,
            type: isVideo ? 'video' : 'image',
          });
          return;
        }
      } catch {
        // fallback
      }
    }

    // Local fallback preview
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedMedia({
        url: reader.result as string,
        type: isVideo ? 'video' : 'image',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedMedia) || !profile) return;
    const text = input.trim();
    const media = selectedMedia;

    setInput('');
    setSelectedMedia(null);
    sendTyping(false);

    const res = await sendMessage(text, profile, media?.url, media?.type);
    if (res.error) {
      setRateLimitWarning(res.error);
      setTimeout(() => setRateLimitWarning(null), 3000);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!partner || !profile) return;
    setFriendRequestSent(true);
    sendFriendRequestSignal();
    await sendFriendRequest(profile.id, partner.id);
  };

  const handleAcceptFriendRequest = () => {
    respondFriendRequestSignal(true);
    setIsFriendConnected(true);
  };

  const handleDeclineFriendRequest = () => {
    respondFriendRequestSignal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-zinc-950 max-w-5xl mx-auto w-full border-x border-zinc-800/80">
      {/* Status Bar */}
      <div className="h-14 border-b border-zinc-800 bg-zinc-900/60 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          {status === 'searching' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Looking for someone to chat with...</span>
            </div>
          )}

          {status === 'matched' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {isFriendConnected
                  ? `Connected with @${partner?.nickname || 'Friend'}`
                  : 'Chatting with a random stranger'}
              </span>
            </div>
          )}

          {status === 'ended' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Stranger disconnected</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Unlock Call Buttons if connection accepted */}
          {status === 'matched' && isFriendConnected && partner && profile && (
            <div className="flex items-center gap-1.5 pr-2 border-r border-zinc-800">
              <button
                onClick={() => startCall(partner, profile, false)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sky-400 cursor-pointer"
                title="Start Audio Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => startCall(partner, profile, true)}
                className="p-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black cursor-pointer"
                title="Start Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Add Connection / Friend Request Button */}
          {status === 'matched' && !isFriendConnected && (
            <button
              onClick={handleSendFriendRequest}
              disabled={friendRequestSent}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                friendRequestSent
                  ? 'bg-zinc-800 text-zinc-500'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-sky-400 hover:text-sky-300 border border-zinc-700/60'
              }`}
              title="Send Connection Request to unlock Audio & Video calling"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{friendRequestSent ? 'Request Sent' : 'Connect'}</span>
            </button>
          )}

          {status === 'matched' && (
            <>
              <button
                onClick={() => setReportOpen(true)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 transition cursor-pointer"
                title="Report Stranger"
              >
                <Flag className="w-4 h-4" />
              </button>
              <button
                onClick={() => setBlockOpen(true)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition cursor-pointer"
                title="Block Stranger"
              >
                <Ban className="w-4 h-4" />
              </button>
            </>
          )}

          {(status === 'ended' || status === 'matched') && (
            <button
              onClick={() => profile && nextMatch(profile)}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              New Chat
            </button>
          )}
        </div>
      </div>

      {/* Incoming Connection Request Banner */}
      {incomingFriendRequest && status === 'matched' && (
        <div className="bg-sky-950/60 border-b border-sky-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-sky-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-sky-400" />
            <span>Stranger sent you a connection request! Accept to reveal IDs and unlock calls.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAcceptFriendRequest}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Accept
            </button>
            <button
              onClick={handleDeclineFriendRequest}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Rate limit warning banner */}
      {rateLimitWarning && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-300 flex items-center gap-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{rateLimitWarning}</span>
        </div>
      )}

      {/* Main Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 flex flex-col font-sans">
        {messages.map((msg) => {
          if (msg.is_system) {
            return (
              <div key={msg.id} className="text-center my-3">
                <span className="inline-block px-3.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-400 shadow-sm">
                  {msg.content}
                </span>
              </div>
            );
          }

          const isMe = msg.sender_id === profile?.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] sm:max-w-xl ${
                isMe ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words shadow-sm ${
                  isMe
                    ? 'bg-sky-500/15 border border-sky-500/40 text-sky-100 rounded-br-none'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-none'
                }`}
              >
                <div
                  className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                    isMe ? 'text-sky-400' : 'text-zinc-400'
                  }`}
                >
                  {isMe ? 'You' : isFriendConnected ? `@${partner?.nickname || 'Stranger'}` : 'Stranger'}
                </div>

                {/* Inline Media Rendering */}
                {msg.media_url && (
                  <div className="mb-2 rounded-xl overflow-hidden max-w-sm">
                    {msg.media_type === 'video' ? (
                      <video src={msg.media_url} controls className="w-full max-h-56 rounded-lg bg-black" />
                    ) : (
                      <img
                        src={msg.media_url}
                        alt="Shared image"
                        className="w-full object-cover rounded-lg cursor-pointer hover:opacity-95"
                        onClick={() => window.open(msg.media_url!, '_blank')}
                      />
                    )}
                  </div>
                )}

                {msg.content && <div className="whitespace-pre-wrap">{msg.content}</div>}
              </div>
            </div>
          );
        })}

        {/* Partner Typing Indicator */}
        {partnerTyping && status === 'matched' && (
          <div className="mr-auto items-start my-1">
            <div className="px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-1.5">
              <span className="font-semibold text-zinc-300">
                {isFriendConnected ? `@${partner?.nickname || 'Stranger'}` : 'Stranger'}
              </span>{' '}
              is typing
              <span className="flex items-center gap-0.5 ml-1">
                <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce" />
                <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]" />
              </span>
            </div>
          </div>
        )}

        {/* Disconnected End Banner */}
        {status === 'ended' && (
          <div className="p-4 my-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center max-w-sm mx-auto space-y-3">
            <p className="text-xs text-zinc-300 font-medium">Your chat has ended.</p>
            <button
              onClick={() => profile && nextMatch(profile)}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Find a New Stranger [Esc]
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selected Media Preview Bar */}
      {selectedMedia && (
        <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
          <span className="flex items-center gap-2 truncate">
            <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
            {selectedMedia.type === 'video' ? 'Video ready to send' : 'Image ready to send'}
          </span>
          <button
            type="button"
            onClick={() => setSelectedMedia(null)}
            className="p-1 rounded text-zinc-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Classic Ergonomic Control Bar */}
      <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-900/70 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2 sm:gap-3">
          {/* Big Disconnect / Stop Button */}
          <button
            type="button"
            onClick={handleStopClick}
            className={`px-4 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer shrink-0 select-none ${
              status === 'ended'
                ? 'bg-sky-500 hover:bg-sky-400 text-black shadow-lg shadow-sky-500/20 animate-pulse'
                : stopConfirm
                ? 'bg-amber-500 hover:bg-amber-400 text-black ring-2 ring-amber-400/50'
                : 'bg-zinc-800 hover:bg-rose-600/80 text-zinc-300 hover:text-white border border-zinc-700/60'
            }`}
          >
            {status === 'ended'
              ? 'New [Esc]'
              : status === 'searching'
              ? 'Cancel'
              : stopConfirm
              ? 'Really? [Esc]'
              : 'Stop [Esc]'}
          </button>

          {/* Media Attachment Button */}
          <label
            className={`p-3 rounded-xl border border-zinc-800 transition cursor-pointer shrink-0 ${
              status !== 'matched'
                ? 'opacity-40 cursor-not-allowed bg-zinc-950 text-zinc-600'
                : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Send Image or Video"
          >
            <Paperclip className="w-4 h-4" />
            <input
              type="file"
              disabled={status !== 'matched'}
              accept="image/*,video/*"
              onChange={handleMediaUpload}
              className="hidden"
            />
          </label>

          {/* Text Message Input */}
          <input
            ref={inputRef}
            type="text"
            disabled={status !== 'matched'}
            value={input}
            onChange={handleInputChange}
            placeholder={
              status === 'matched'
                ? 'Type message and press Enter...'
                : status === 'searching'
                ? 'Finding a stranger...'
                : 'Chat ended. Click New [Esc] to start.'
            }
            className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 disabled:opacity-50 transition"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={status !== 'matched' || (!input.trim() && !selectedMedia)}
            className="px-4 sm:px-5 py-3 bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs sm:text-sm rounded-xl transition shadow-md shadow-sky-500/20 disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Moderation Modals */}
      {partner && (
        <>
          <ReportModal
            isOpen={reportOpen}
            onClose={() => setReportOpen(false)}
            targetUserId={partner.id}
            targetNickname={partner.nickname}
          />
          <BlockModal
            isOpen={blockOpen}
            onClose={() => setBlockOpen(false)}
            targetUserId={partner.id}
            targetNickname={partner.nickname}
            onBlocked={() => leaveMatch()}
          />
        </>
      )}
    </div>
  );
};
