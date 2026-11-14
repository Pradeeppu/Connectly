import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchStore } from '../stores/matchStore';
import { useAuthStore } from '../stores/authStore';
import { useCallStore } from '../stores/callStore';
import { useFriendStore } from '../stores/friendStore';
import { useThemeStore } from '../stores/themeStore';
import { ReportModal } from '../features/moderation/ReportModal';
import { BlockModal } from '../features/moderation/BlockModal';
import { EmojiPicker } from '../components/chat/EmojiPicker';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Send,
  Flag,
  Ban,
  RotateCw,
  Loader2,
  AlertCircle,
  Paperclip,
  Smile,
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
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [input, setInput] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
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
    setEmojiOpen(false);
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
    setEmojiOpen(false);
    sendTyping(false);

    const res = await sendMessage(text, profile, media?.url, media?.type);
    if (res.error) {
      setRateLimitWarning(res.error);
      setTimeout(() => setRateLimitWarning(null), 3000);
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
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
    <div className={`flex-1 flex flex-col h-[calc(100vh-3.5rem)] max-w-5xl mx-auto w-full border-x transition-colors ${
      isDark ? 'bg-zinc-950 border-zinc-800/80 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
    }`}>
      {/* Status Bar */}
      <div className={`min-h-14 sm:h-16 border-b px-3 sm:px-5 py-2 flex items-center justify-between gap-2 shrink-0 transition-colors ${
        isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-white/80'
      }`}>
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {status === 'searching' && (
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-amber-500">
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-amber-500 shrink-0" />
              <span className="truncate">Looking for someone to chat with...</span>
            </div>
          )}

          {status === 'matched' && (
            <div className={`flex items-center gap-2 text-xs sm:text-sm font-bold ${
              isDark ? 'text-zinc-200' : 'text-zinc-800'
            }`}>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-none">
                {isFriendConnected
                  ? `Connected with @${partner?.nickname || 'Friend'}`
                  : 'Chatting with a stranger'}
              </span>
            </div>
          )}

          {status === 'ended' && (
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-rose-500">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span>Stranger disconnected</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Unlock Call Buttons if connection accepted */}
          {status === 'matched' && isFriendConnected && partner && profile && (
            <div className={`flex items-center gap-1 sm:gap-1.5 pr-1.5 sm:pr-2 border-r ${
              isDark ? 'border-zinc-800' : 'border-zinc-200'
            }`}>
              <button
                onClick={() => startCall(partner, profile, false)}
                className={`p-2 sm:p-2 rounded-xl text-sky-500 cursor-pointer transition active:scale-95 ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'
                }`}
                title="Start Audio Call"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => startCall(partner, profile, true)}
                className="p-2 sm:p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black cursor-pointer transition active:scale-95 shadow-md shadow-sky-500/20"
                title="Start Video Call"
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}

          {/* Add Connection / Friend Request Button */}
          {status === 'matched' && !isFriendConnected && (
            <button
              onClick={handleSendFriendRequest}
              disabled={friendRequestSent}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                friendRequestSent
                  ? isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-200 text-zinc-400'
                  : isDark
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-sky-400 hover:text-sky-300 border border-zinc-700/60 shadow-sm'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-sky-600 hover:text-sky-700 border border-zinc-300 shadow-sm'
              }`}
              title="Send Connection Request to unlock Audio & Video calling"
            >
              <UserPlus className="w-4 h-4" />
              <span>{friendRequestSent ? 'Sent' : 'Connect'}</span>
            </button>
          )}

          {status === 'matched' && (
            <>
              <button
                onClick={() => setReportOpen(true)}
                className={`p-2 sm:p-2 rounded-xl transition cursor-pointer active:scale-95 ${
                  isDark ? 'text-zinc-500 hover:text-amber-400 hover:bg-zinc-800' : 'text-zinc-400 hover:text-amber-600 hover:bg-zinc-100'
                }`}
                title="Report Stranger"
              >
                <Flag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
              <button
                onClick={() => setBlockOpen(true)}
                className={`p-2 sm:p-2 rounded-xl transition cursor-pointer active:scale-95 ${
                  isDark ? 'text-zinc-500 hover:text-rose-400 hover:bg-zinc-800' : 'text-zinc-400 hover:text-rose-600 hover:bg-zinc-100'
                }`}
                title="Block Stranger"
              >
                <Ban className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </>
          )}

          {(status === 'ended' || status === 'matched') && (
            <button
              onClick={() => profile && nextMatch(profile)}
              className="px-3 sm:px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black text-xs sm:text-sm font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-sky-500/20"
            >
              <RotateCw className="w-4 h-4" />
              <span>New</span>
            </button>
          )}
        </div>
      </div>

      {/* Incoming Connection Request Banner */}
      {incomingFriendRequest && status === 'matched' && (
        <div className={`border-b px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm animate-in fade-in ${
          isDark ? 'bg-sky-950/60 border-sky-500/30 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-900'
        }`}>
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-sky-500" />
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
              className={`p-1 rounded-lg cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Rate limit warning banner */}
      {rateLimitWarning && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs sm:text-sm text-amber-500 flex items-center gap-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{rateLimitWarning}</span>
        </div>
      )}

      {/* Main Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3.5 flex flex-col font-sans">
        {messages.map((msg) => {
          if (msg.is_system) {
            return (
              <div key={msg.id} className="text-center my-3">
                <span className={`inline-block px-4 py-1.5 rounded-full border text-xs sm:text-sm font-semibold shadow-sm ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                }`}>
                  {msg.content}
                </span>
              </div>
            );
          }

          const isMe = msg.sender_id === profile?.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[88%] sm:max-w-xl ${
                isMe ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div
                className={`p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base leading-relaxed break-words shadow-sm ${
                  isMe
                    ? (isDark 
                        ? 'bg-sky-500/15 border border-sky-500/40 text-sky-100 rounded-br-none' 
                        : 'bg-sky-50 border border-sky-200 text-sky-950 rounded-br-none')
                    : (isDark 
                        ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-none' 
                        : 'bg-white border border-zinc-200 text-zinc-900 shadow-sm rounded-bl-none')
                }`}
              >
                <div
                  className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1 ${
                    isMe ? (isDark ? 'text-sky-400' : 'text-sky-600') : (isDark ? 'text-zinc-400' : 'text-zinc-500')
                  }`}
                >
                  {isMe ? 'You' : isFriendConnected ? `@${partner?.nickname || 'Stranger'}` : 'Stranger'}
                </div>

                {/* Inline Media Rendering */}
                {msg.media_url && (
                  <div className="mb-2 rounded-xl overflow-hidden max-w-xs sm:max-w-sm">
                    {msg.media_type === 'video' ? (
                      <video src={msg.media_url} controls className="w-full max-h-64 rounded-lg bg-black" />
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
            <div className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm flex items-center gap-1.5 ${
              isDark ? 'bg-zinc-900/80 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700 shadow-sm'
            }`}>
              <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                {isFriendConnected ? `@${partner?.nickname || 'Stranger'}` : 'Stranger'}
              </span>{' '}
              is typing
              <span className="flex items-center gap-0.5 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]" />
              </span>
            </div>
          </div>
        )}

        {/* Disconnected End Banner */}
        {status === 'ended' && (
          <div className={`p-5 my-4 rounded-2xl border text-center max-w-sm mx-auto space-y-3.5 ${
            isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-200 shadow-md'
          }`}>
            <p className={`text-sm sm:text-base font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Your chat has ended.
            </p>
            <button
              onClick={() => profile && nextMatch(profile)}
              className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-black font-black text-sm sm:text-base rounded-xl shadow-lg shadow-sky-500/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
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
        <div className={`px-4 py-2.5 border-t flex items-center justify-between text-xs sm:text-sm ${
          isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
        }`}>
          <span className="flex items-center gap-2 truncate">
            <ImageIcon className="w-4 h-4 text-sky-500 shrink-0" />
            {selectedMedia.type === 'video' ? 'Video ready to send' : 'Image ready to send'}
          </span>
          <button
            type="button"
            onClick={() => setSelectedMedia(null)}
            className={`p-1 rounded cursor-pointer ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-800'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Classic Ergonomic Control Bar */}
      <div className={`relative p-2.5 sm:p-4 border-t shrink-0 transition-colors ${
        isDark ? 'border-zinc-800 bg-zinc-900/80' : 'border-zinc-200 bg-white'
      }`}>
        {/* Emoji Picker Popover */}
        <EmojiPicker
          isOpen={emojiOpen}
          onClose={() => setEmojiOpen(false)}
          onSelect={handleSelectEmoji}
          isDark={isDark}
        />

        <form onSubmit={handleSend} className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Big Disconnect / Stop Button */}
          <button
            type="button"
            onClick={handleStopClick}
            className={`px-3 sm:px-5 py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shrink-0 select-none active:scale-95 ${
              status === 'ended'
                ? 'bg-sky-500 hover:bg-sky-400 text-black shadow-lg shadow-sky-500/20 animate-pulse'
                : stopConfirm
                ? 'bg-amber-500 hover:bg-amber-400 text-black ring-2 ring-amber-400/50'
                : isDark
                ? 'bg-zinc-800 hover:bg-rose-600/80 text-zinc-200 hover:text-white border border-zinc-700/60'
                : 'bg-zinc-100 hover:bg-rose-600 text-zinc-800 hover:text-white border border-zinc-300'
            }`}
          >
            {status === 'ended'
              ? 'New [Esc]'
              : status === 'searching'
              ? 'Cancel'
              : stopConfirm
              ? 'Really?'
              : 'Stop'}
          </button>

          {/* Media Attachment Button */}
          <label
            className={`p-3.5 rounded-xl border transition cursor-pointer shrink-0 active:scale-95 ${
              status !== 'matched'
                ? 'opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-950 text-zinc-400'
                : isDark
                ? 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 border-zinc-300'
            }`}
            title="Send Image or Video"
          >
            <Paperclip className="w-5 h-5" />
            <input
              type="file"
              disabled={status !== 'matched'}
              accept="image/*,video/*"
              onChange={handleMediaUpload}
              className="hidden"
            />
          </label>

          {/* Emoji Tray Toggle Button */}
          <button
            type="button"
            disabled={status !== 'matched'}
            onClick={() => setEmojiOpen((prev) => !prev)}
            className={`p-3.5 rounded-xl border transition cursor-pointer shrink-0 active:scale-95 ${
              status !== 'matched'
                ? 'opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-950 text-zinc-400'
                : emojiOpen
                ? 'bg-sky-500 text-black border-sky-400 shadow-md shadow-sky-500/20'
                : isDark
                ? 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 border-zinc-800'
                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 hover:text-amber-500 border-zinc-300'
            }`}
            title="Insert Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Text Message Input (16px base font prevents iOS mobile zoom) */}
          <input
            ref={inputRef}
            type="text"
            disabled={status !== 'matched'}
            value={input}
            onChange={handleInputChange}
            placeholder={
              status === 'matched'
                ? 'Type message...'
                : status === 'searching'
                ? 'Finding a stranger...'
                : 'Chat ended.'
            }
            className={`flex-1 px-4 py-3.5 border rounded-xl text-base sm:text-base transition min-w-0 focus:outline-none focus:border-sky-500 disabled:opacity-50 ${
              isDark
                ? 'bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600'
                : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
            }`}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={status !== 'matched' || (!input.trim() && !selectedMedia)}
            className="p-3.5 sm:px-5 sm:py-3.5 bg-sky-500 hover:bg-sky-400 text-black font-black text-sm rounded-xl transition shadow-md shadow-sky-500/20 disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
            title="Send Message"
          >
            <Send className="w-5 h-5" />
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
