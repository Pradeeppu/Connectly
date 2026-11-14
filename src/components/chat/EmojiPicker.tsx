import React, { useState, useEffect, useRef } from 'react';
import { Smile, Heart, ThumbsUp, Sparkles, Coffee, X } from 'lucide-react';

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  isDark: boolean;
}

const EMOJI_CATEGORIES = [
  {
    id: 'popular',
    name: 'Top',
    icon: Sparkles,
    emojis: ['😂', '❤️', '🔥', '👍', '😭', '😍', '✨', '👏', '🎉', '🥺', '🙏', '💯', '🚀', '💀', '👀', '😎', '🥳', '🤔', '💔', '👌'],
  },
  {
    id: 'smileys',
    name: 'Faces',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
      '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
      '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
      '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
      '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
      '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧',
      '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓',
      '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀',
    ],
  },
  {
    id: 'gestures',
    name: 'Hands',
    icon: ThumbsUp,
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
    ],
  },
  {
    id: 'hearts',
    name: 'Hearts',
    icon: Heart,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💋',
      '💌', '💍', '💎', '💐', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻',
    ],
  },
  {
    id: 'fun',
    name: 'Fun',
    icon: Coffee,
    emojis: [
      '🔥', '💯', '✨', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈',
      '🥉', '⚽', '🏀', '🏈', '⚾', '🎾', '🎮', '🎲', '🎯', '🎨',
      '🎬', '🎤', '🎧', '🎸', '🎹', '☕', '🍺', '🍻', '🍷', '🍕',
      '🍔', '🍟', '🍦', '🍩', '🍫', '🍿', '🚀', '💡', '💬', '⚡',
    ],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ isOpen, onClose, onSelect, isDark }) => {
  const [activeCategory, setActiveCategory] = useState('popular');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentGroup = EMOJI_CATEGORIES.find((c) => c.id === activeCategory) || EMOJI_CATEGORIES[0];

  return (
    <div
      ref={pickerRef}
      className={`absolute bottom-full mb-3 left-2 sm:left-4 z-50 w-[300px] sm:w-[350px] max-h-[340px] rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-md ${
        isDark
          ? 'bg-zinc-900/95 border-zinc-800 text-white'
          : 'bg-white/95 border-zinc-200 text-zinc-900 shadow-zinc-300/50'
      }`}
    >
      {/* Header Tabs */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b shrink-0 ${
          isDark ? 'border-zinc-800 bg-zinc-950/60' : 'border-zinc-200 bg-zinc-100/70'
        }`}
      >
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-sky-500 text-black shadow-sm'
                    : isDark
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-200/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{cat.name}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`p-1 rounded-lg cursor-pointer transition ${
            isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-black hover:bg-zinc-200'
          }`}
          title="Close Emojis"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Emoji Grid */}
      <div className="p-3 overflow-y-auto max-h-[260px] grid grid-cols-7 sm:grid-cols-8 gap-1.5 sm:gap-2">
        {currentGroup.emojis.map((emoji, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(emoji)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xl sm:text-2xl transition-all cursor-pointer active:scale-90 select-none ${
              isDark
                ? 'hover:bg-zinc-800 hover:scale-115'
                : 'hover:bg-zinc-100 hover:scale-115'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
