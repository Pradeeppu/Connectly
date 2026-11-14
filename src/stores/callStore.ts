import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface CallState {
  callStatus: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  caller: UserProfile | null;
  callee: UserProfile | null;
  isVideo: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  channel: any | null;
  peerConnection: RTCPeerConnection | null;

  initSignaling: (currentUserId: string) => void;
  startCall: (targetUser: UserProfile, currentUser: UserProfile, isVideo: boolean) => Promise<void>;
  answerCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  callStatus: 'idle',
  caller: null,
  callee: null,
  isVideo: true,
  isMuted: false,
  isVideoOff: false,
  localStream: null,
  remoteStream: null,
  channel: null,
  peerConnection: null,

  initSignaling: (currentUserId: string) => {
    // Listen for incoming call signals on user's personal signaling channel
    const sigChannel = supabase
      .channel(`signaling:${currentUserId}`)
      .on('broadcast', { event: 'call:offer' }, async ({ payload }) => {
        if (get().callStatus !== 'idle') return; // Busy
        set({
          callStatus: 'ringing',
          caller: payload.caller,
          isVideo: payload.isVideo,
        });
      })
      .on('broadcast', { event: 'call:answer' }, async ({ payload }) => {
        const pc = get().peerConnection;
        if (pc && payload.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          set({ callStatus: 'connected' });
        }
      })
      .on('broadcast', { event: 'call:ice-candidate' }, async ({ payload }) => {
        const pc = get().peerConnection;
        if (pc && payload.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch {
            // ignore
          }
        }
      })
      .on('broadcast', { event: 'call:ended' }, () => {
        get().endCall();
      })
      .subscribe();

    set({ channel: sigChannel });
  },

  startCall: async (targetUser: UserProfile, currentUser: UserProfile, isVideo: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });

      const pc = new RTCPeerConnection(RTC_CONFIG);
      const remoteStream = new MediaStream();

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          supabase.channel(`signaling:${targetUser.id}`).send({
            type: 'broadcast',
            event: 'call:ice-candidate',
            payload: { candidate: event.candidate },
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      set({
        callStatus: 'calling',
        callee: targetUser,
        caller: currentUser,
        isVideo,
        localStream: stream,
        remoteStream,
        peerConnection: pc,
      });

      // Send offer to target user
      supabase.channel(`signaling:${targetUser.id}`).send({
        type: 'broadcast',
        event: 'call:offer',
        payload: {
          caller: currentUser,
          sdp: offer,
          isVideo,
        },
      });
    } catch (err) {
      console.error('Call media error:', err);
      set({ callStatus: 'idle' });
    }
  },

  answerCall: async () => {
    const { caller, isVideo } = get();
    if (!caller) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });

      const pc = new RTCPeerConnection(RTC_CONFIG);
      const remoteStream = new MediaStream();

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          supabase.channel(`signaling:${caller.id}`).send({
            type: 'broadcast',
            event: 'call:ice-candidate',
            payload: { candidate: event.candidate },
          });
        }
      };

      // In real scenario, caller's offer SDP is set then answer generated
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      set({
        callStatus: 'connected',
        localStream: stream,
        remoteStream,
        peerConnection: pc,
      });

      supabase.channel(`signaling:${caller.id}`).send({
        type: 'broadcast',
        event: 'call:answer',
        payload: { sdp: answer },
      });
    } catch (err) {
      console.error('Answer call error:', err);
      get().endCall();
    }
  },

  declineCall: () => {
    const { caller } = get();
    if (caller) {
      supabase.channel(`signaling:${caller.id}`).send({
        type: 'broadcast',
        event: 'call:ended',
        payload: {},
      });
    }
    set({ callStatus: 'idle', caller: null, callee: null });
  },

  endCall: () => {
    const { localStream, peerConnection, caller, callee } = get();
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }

    const targetId = callee?.id || caller?.id;
    if (targetId) {
      supabase.channel(`signaling:${targetId}`).send({
        type: 'broadcast',
        event: 'call:ended',
        payload: {},
      });
    }

    set({
      callStatus: 'idle',
      caller: null,
      callee: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
    });
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // toggle
      });
    }
    set({ isMuted: !isMuted });
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff; // toggle
      });
    }
    set({ isVideoOff: !isVideoOff });
  },
}));
