import React, { useState } from 'react';
import { useFriendStore } from '../../stores/friendStore';
import { useCallStore } from '../../stores/callStore';
import { useAuthStore } from '../../stores/authStore';
import { Modal } from '../shared/Modal';
import {
  Users,
  MessageSquare,
  Phone,
  Video,
  Check,
  X,
  Send,
  Image,
  ArrowLeft,
  Paperclip,
} from 'lucide-react';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuthStore();
  const {
    friends,
    pendingRequests,
    activeFriendChat,
    friendMessages,
    acceptFriendRequest,
    rejectFriendRequest,
    openFriendChat,
    closeFriendChat,
    sendFriendMessage,
  } = useFriendStore();

  const { startCall } = useCallStore();

  const [inputMsg, setInputMsg] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  if (!isOpen) return null;

  const handleMediaPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    const isImage = file.type.startsWith('image');
    if (!isImage && !isVideo) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('Media file must be under 20MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedMedia({
        url: reader.result as string,
        type: isVideo ? 'video' : 'image',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMsg.trim() && !selectedMedia) || !profile) return;

    const text = inputMsg;
    const media = selectedMedia;
    setInputMsg('');
    setSelectedMedia(null);

    await sendFriendMessage(text, profile.id, media?.url, media?.type);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        closeFriendChat();
        onClose();
      }}
      title={activeFriendChat ? `@${activeFriendChat.nickname}` : 'Friends & Connections'}
      maxWidth="max-w-xl"
    >
      {/* View 1: Active Chat with Friend */}
      {activeFriendChat ? (
        <div className="flex flex-col h-[500px]">
          {/* Top Bar inside Friend Chat */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <button
              onClick={() => closeFriendChat()}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Friends
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => profile && startCall(activeFriendChat, profile, false)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sky-400 hover:text-sky-300 transition cursor-pointer"
                title="Start Audio Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => profile && startCall(activeFriendChat, profile, true)}
                className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold transition cursor-pointer"
                title="Start Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-3 p-2 font-sans">
            {friendMessages.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                Connected! Send a message or start a video call.
              </div>
            ) : (
              friendMessages.map((msg) => {
                const isMe = msg.sender_id === profile?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isMe
                          ? 'bg-sky-500/20 border border-sky-500/40 text-sky-100 rounded-br-none'
                          : 'bg-zinc-800 border border-zinc-700/60 text-zinc-100 rounded-bl-none'
                      }`}
                    >
                      {msg.media_url && (
                        <div className="mb-2 rounded-xl overflow-hidden max-w-xs">
                          {msg.media_type === 'video' ? (
                            <video src={msg.media_url} controls className="w-full max-h-48 rounded-lg" />
                          ) : (
                            <img src={msg.media_url} alt="Shared media" className="w-full object-cover rounded-lg" />
                          )}
                        </div>
                      )}
                      {msg.content && <p>{msg.content}</p>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Media preview tag */}
          {selectedMedia && (
            <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between text-xs text-zinc-300 mb-2">
              <span className="flex items-center gap-1.5 truncate">
                <Image className="w-4 h-4 text-sky-400 shrink-0" />
                Media attached ready to send
              </span>
              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-3 border-t border-zinc-800">
            <label className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white cursor-pointer transition">
              <Paperclip className="w-4 h-4" />
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaPick}
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Type message to friend..."
              className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={!inputMsg.trim() && !selectedMedia}
              className="p-2.5 bg-sky-500 hover:bg-sky-400 text-black rounded-xl transition cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* View 2: Friends List & Incoming Requests */
        <div className="space-y-5">
          {/* Incoming Requests */}
          {pendingRequests.length > 0 && (
            <div>
              <div className="text-xs font-bold text-amber-400 mb-2">
                Pending Requests ({pendingRequests.length})
              </div>
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                        {req.sender?.nickname?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          @{req.sender?.nickname || 'Stranger'}
                        </span>
                        <span className="text-[10px] text-zinc-400">Wants to connect</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => profile && acceptFriendRequest(req.id, profile.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={() => rejectFriendRequest(req.id)}
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          <div>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              All Friends ({friends.length})
            </div>
            {friends.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs">
                <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p>No friends added yet.</p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Connect with people in random chat to add them to your friends list!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((f) => {
                  const friendUser = f.friend || {
                    id: f.friend_id,
                    nickname: 'Friend',
                    is_guest: false,
                    role: 'user',
                    is_banned: false,
                    created_at: '',
                  };
                  return (
                    <div
                      key={f.friend_id}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                            {friendUser.nickname.charAt(0)}
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950 absolute bottom-0 right-0" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            @{friendUser.nickname}
                          </span>
                          <span className="text-[10px] text-emerald-400">Online</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => profile && openFriendChat(friendUser as any, profile.id)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                          Chat
                        </button>
                        <button
                          onClick={() => profile && startCall(friendUser as any, profile, true)}
                          className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl cursor-pointer"
                          title="Video Call"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
