import React, { useState } from 'react';
import { Modal } from '../../components/shared/Modal';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Ban, Check } from 'lucide-react';

interface BlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetNickname: string;
  onBlocked?: () => void;
}

export const BlockModal: React.FC<BlockModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetNickname,
  onBlocked,
}) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBlock = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && user) {
        await supabase.from('blocks').upsert({
          blocker_id: user.id,
          blocked_id: targetUserId,
        });
      }
      setSuccess(true);
      if (onBlocked) onBlocked();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Block Stranger">
      {success ? (
        <div className="flex flex-col items-center justify-center py-5 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
            <Check className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Stranger Blocked</h3>
          <p className="text-xs text-zinc-400">You will never be matched with them again.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
            <Ban className="w-4 h-4 shrink-0" />
            <span>
              Block <strong className="text-white">@{targetNickname}</strong>?
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            This will immediately disconnect your chat and prevent future random matches with this user.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleBlock}
              disabled={loading}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Blocking...' : 'Block & Disconnect'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
