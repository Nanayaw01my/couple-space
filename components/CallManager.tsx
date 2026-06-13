'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff } from 'lucide-react';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

interface CallDoc {
  _id: string;
  callerId: string;
  callerName: string;
  type: 'audio' | 'video';
  status: 'ringing' | 'active' | 'ended' | 'rejected';
  offer: string | null;
  answer: string | null;
}

type CS = 'idle' | 'initiating' | 'ringing' | 'connecting' | 'active';

export default function CallManager() {
  const { data: session, status: sessionStatus } = useSession();
  const userId = (session?.user as any)?.id as string | undefined;

  const [cs, setCs] = useState<CS>('idle');
  const [callDoc, setCallDoc] = useState<CallDoc | null>(null);
  const [muted, setMuted] = useState(false);
  const [vidOff, setVidOff] = useState(false);
  const [picker, setPicker] = useState(false);
  const [dur, setDur] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localRef = useRef<MediaStream | null>(null);
  const localVid = useRef<HTMLVideoElement>(null);
  const remoteVid = useRef<HTMLVideoElement>(null);
  const callIdRef = useRef<string | null>(null);
  const csRef = useRef<CS>('idle');
  const durRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRemoteRef = useRef(false);

  const updCs = (s: CS) => { csRef.current = s; setCs(s); };

  const cleanup = useCallback(() => {
    localRef.current?.getTracks().forEach(t => t.stop());
    localRef.current = null;
    if (localVid.current) localVid.current.srcObject = null;
    if (remoteVid.current) remoteVid.current.srcObject = null;
    pcRef.current?.close(); pcRef.current = null;
    callIdRef.current = null;
    hasRemoteRef.current = false;
    if (durRef.current) clearInterval(durRef.current);
    updCs('idle'); setCallDoc(null); setMuted(false); setVidOff(false); setDur(0);
  }, []);

  const poll = useCallback(async () => {
    if (!userId || sessionStatus !== 'authenticated') return;
    const res = await fetch('/api/call').catch(() => null);
    if (!res?.ok) return;
    const data: CallDoc | null = await res.json();
    const cur = csRef.current;

    if (!data) { if (cur !== 'idle') cleanup(); return; }
    if (data.status === 'ended' || data.status === 'rejected') { if (cur !== 'idle') cleanup(); return; }

    setCallDoc(data);

    if (data.status === 'ringing' && data.callerId !== userId && cur === 'idle') {
      updCs('ringing');
    }

    if (data.callerId === userId && cur === 'initiating' && data.answer && pcRef.current && !hasRemoteRef.current) {
      if (pcRef.current.signalingState === 'have-local-offer') {
        try {
          hasRemoteRef.current = true;
          await pcRef.current.setRemoteDescription(JSON.parse(data.answer));
        } catch (e) { console.error('setRemoteDescription failed:', e); }
      }
    }
  }, [userId, sessionStatus, cleanup]);

  useEffect(() => {
    if (!userId) return;
    const t = setInterval(poll, 2000);
    return () => clearInterval(t);
  }, [userId, poll]);

  async function getMedia(type: 'audio' | 'video') {
    return navigator.mediaDevices.getUserMedia(
      type === 'video'
        ? { audio: true, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } }
        : { audio: true, video: false }
    );
  }

  async function waitIce(pc: RTCPeerConnection) {
    return new Promise<void>(resolve => {
      if (pc.iceGatheringState === 'complete') { resolve(); return; }
      const fn = () => { if (pc.iceGatheringState === 'complete') { pc.removeEventListener('icegatheringstatechange', fn); resolve(); } };
      pc.addEventListener('icegatheringstatechange', fn);
      setTimeout(resolve, 8000);
    });
  }

  function makePc() {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.ontrack = e => {
      if (remoteVid.current) remoteVid.current.srcObject = e.streams[0];
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        updCs('active');
        durRef.current = setInterval(() => setDur(d => d + 1), 1000);
      }
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') endCall();
    };
    return pc;
  }

  async function startCall(type: 'audio' | 'video') {
    if (csRef.current !== 'idle') return;
    setPicker(false);
    updCs('initiating');
    try {
      const res = await fetch('/api/call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'initiate', type }) });
      const doc: CallDoc = await res.json();
      callIdRef.current = doc._id; setCallDoc(doc);

      const stream = await getMedia(type);
      localRef.current = stream;
      if (localVid.current) localVid.current.srcObject = stream;

      const pc = makePc(); pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitIce(pc);

      await fetch('/api/call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'offer', callId: doc._id, offer: JSON.stringify(pc.localDescription) }) });
    } catch (err) { console.error('startCall failed:', err); await endCall(); }
  }

  async function acceptCall() {
    if (!callDoc || csRef.current !== 'ringing') return;
    updCs('connecting');
    callIdRef.current = callDoc._id;
    try {
      const stream = await getMedia(callDoc.type);
      localRef.current = stream;
      if (localVid.current) localVid.current.srcObject = stream;

      const pc = makePc(); pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      let offer = callDoc.offer;
      for (let i = 0; i < 10 && !offer; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const r = await fetch('/api/call').catch(() => null);
        if (r?.ok) { const d: CallDoc = await r.json(); offer = d?.offer ?? null; }
      }
      if (!offer) throw new Error('No offer received');

      await pc.setRemoteDescription(JSON.parse(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitIce(pc);

      await fetch('/api/call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'answer', callId: callDoc._id, answer: JSON.stringify(pc.localDescription) }) });
    } catch (err) { console.error('acceptCall failed:', err); await endCall(); }
  }

  async function rejectCall() {
    if (callDoc) await fetch('/api/call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject', callId: callDoc._id }) }).catch(() => {});
    cleanup();
  }

  async function endCall() {
    if (callIdRef.current) await fetch('/api/call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'end', callId: callIdRef.current }) }).catch(() => {});
    cleanup();
  }

  function toggleMute() { localRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; }); setMuted(m => !m); }
  function toggleVid() { localRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; }); setVidOff(v => !v); }
  function fmt(s: number) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }

  const isVid = callDoc?.type === 'video';
  const partnerName = callDoc
    ? (callDoc.callerId === userId ? 'Your partner' : callDoc.callerName)
    : 'Your partner';

  return (
    <>
      <div className={`fixed inset-0 z-50 bg-gray-900 flex flex-col ${cs === 'idle' ? 'hidden' : ''}`}>
        {/* Remote video — always in DOM so ontrack sets srcObject before cs reaches 'active'.
            opacity-0 hides visually but audio still plays through the element. */}
        <video
          ref={remoteVid}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover z-[1] transition-opacity duration-300 ${isVid && cs === 'active' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        />

        <div className="relative z-[2] flex flex-col h-full">
          {cs === 'ringing' && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <div className="text-7xl mb-4 animate-bounce">{isVid ? '📹' : '📞'}</div>
              <p className="text-gray-400 text-sm uppercase font-bold tracking-widest mb-2">
                Incoming {isVid ? 'Video' : 'Audio'} Call
              </p>
              <h2 className="text-white text-3xl font-bold mb-12">{callDoc?.callerName}</h2>
              <div className="flex gap-16">
                <div className="flex flex-col items-center gap-2">
                  <button onClick={rejectCall} className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xl active:scale-90 transition-all">
                    <PhoneOff size={26} />
                  </button>
                  <p className="text-gray-400 text-xs">Decline</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button onClick={acceptCall} className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-xl active:scale-90 transition-all">
                    <Phone size={26} />
                  </button>
                  <p className="text-gray-400 text-xs">Accept</p>
                </div>
              </div>
            </div>
          )}

          {cs !== 'ringing' && (
            <div className="flex-1 flex flex-col relative">
              <div className="flex-1 flex flex-col items-center justify-center text-white text-center px-6">
                {!isVid && <div className="text-7xl mb-6">{cs === 'active' ? '🎵' : '📞'}</div>}
                <h2 className="text-2xl font-bold mb-1">{partnerName}</h2>
                <p className="text-gray-300 text-sm">
                  {cs === 'initiating' ? 'Calling...' : cs === 'connecting' ? 'Connecting...' : fmt(dur)}
                </p>
                {(cs === 'initiating' || cs === 'connecting') && (
                  <div className="flex gap-1.5 mt-4">
                    {[0, 200, 400].map(d => (
                      <span key={d} className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Local video — always in DOM, opacity-0 for audio calls */}
              <video
                ref={localVid}
                autoPlay
                playsInline
                muted
                className={`absolute top-4 right-4 w-28 h-40 rounded-2xl object-cover border-2 border-white/30 shadow-lg bg-black ${isVid ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              />

              <div className="pb-16 px-6">
                <div className="flex justify-center items-center gap-8">
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${muted ? 'bg-white text-gray-900' : 'bg-white/20 text-white'}`}>
                      {muted ? <MicOff size={22} /> : <Mic size={22} />}
                    </button>
                    <p className="text-white/50 text-[10px]">{muted ? 'Unmute' : 'Mute'}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xl active:scale-90 transition-all">
                      <PhoneOff size={26} />
                    </button>
                    <p className="text-white/50 text-[10px]">End</p>
                  </div>
                  {isVid ? (
                    <div className="flex flex-col items-center gap-1">
                      <button onClick={toggleVid} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${vidOff ? 'bg-white text-gray-900' : 'bg-white/20 text-white'}`}>
                        {vidOff ? <VideoOff size={22} /> : <Video size={22} />}
                      </button>
                      <p className="text-white/50 text-[10px]">{vidOff ? 'Show' : 'Hide'}</p>
                    </div>
                  ) : <div className="w-14 h-14" />}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {cs === 'idle' && (
        <div className="fixed bottom-20 right-4 z-40">
          {picker && (
            <div className="absolute bottom-14 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-44">
              <button onClick={() => startCall('audio')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                <Phone size={16} className="text-rose-500" /> Audio Call
              </button>
              <div className="border-t border-gray-100" />
              <button onClick={() => startCall('video')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                <Video size={16} className="text-rose-500" /> Video Call
              </button>
            </div>
          )}
          <button
            onClick={() => setPicker(v => !v)}
            className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xl active:scale-90 transition-all"
          >
            <Phone size={20} />
          </button>
        </div>
      )}
    </>
  );
}
