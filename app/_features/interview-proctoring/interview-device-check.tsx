"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiCamera,
  FiCheckCircle,
  FiLoader,
  FiLock,
  FiMic,
  FiShield,
  FiVolume2,
} from "react-icons/fi";
import { recordBrowserIntegrityEvent } from "./integrity-api";

type DeviceCheckProps = {
  onReadyChange: (ready: boolean) => void;
};

type FaceMonitorProps = {
  interviewType: "coding" | "mcq";
  sessionId: string;
  token: string;
  websocketBaseUrl: string;
};

type CheckState = "idle" | "checking" | "ready" | "error";
type MonitorState = "connecting" | "verified" | "warning" | "offline";

const integrityRules = [
  "Stay on this interview tab and keep it in fullscreen mode.",
  "Do not open another tab, window, application, or virtual assistant.",
  "Copy, cut, paste, right-click, printing, saving, and developer tools are disabled.",
  "Screenshots, screen recording, phones, books, and help from another person are prohibited.",
];

export function InterviewIntegrityChecklist() {
  return (
    <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <div className="flex items-center gap-2 font-bold"><FiShield aria-hidden /> Interview integrity rules</div>
      <ul className="mt-3 space-y-2 pl-5 text-sm leading-5">
        {integrityRules.map((rule) => <li className="list-disc" key={rule}>{rule}</li>)}
      </ul>
      <p className="mt-3 text-xs leading-5 text-amber-800">Leaving the interview or attempting a restricted action is counted as a violation.</p>
    </section>
  );
}

export function InterviewSecurityGuard({ interviewType, sessionId, token }: { interviewType: "mcq" | "coding"; sessionId: string; token: string }) {
  const [locked, setLocked] = useState(true);
  const [reason, setReason] = useState("Enter fullscreen to begin the secured interview.");
  const [violations, setViolations] = useState(0);
  const lastViolationRef = useRef(0);
  const fullscreenSupported = typeof document !== "undefined" && Boolean(document.documentElement.requestFullscreen);

  const recordViolation = useCallback((message: string) => {
    const now = Date.now();
    if (now - lastViolationRef.current < 800) return;
    lastViolationRef.current = now;
    setViolations((count) => count + 1);
    setReason(message);
    setLocked(true);
    void recordBrowserIntegrityEvent(interviewType, sessionId, token, "browser_restriction_triggered", { message }).catch(() => undefined);
  }, [interviewType, sessionId, token]);

  useEffect(() => {
    const handleContextMenu = (event: Event) => {
      event.preventDefault();
      recordViolation("Right-click is disabled during this interview.");
    };
    const handleClipboard = (event: Event) => {
      event.preventDefault();
      recordViolation("Copy, cut, and paste are disabled during this interview.");
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const modifier = event.ctrlKey || event.metaKey;
      const restricted =
        event.key === "PrintScreen" ||
        event.key === "F12" ||
        (modifier && ["c", "x", "v", "p", "s", "u"].includes(key)) ||
        (modifier && event.shiftKey && ["i", "j", "c"].includes(key));
      if (!restricted) return;
      event.preventDefault();
      event.stopPropagation();
      recordViolation(event.key === "PrintScreen" ? "A screenshot attempt was detected." : "That keyboard shortcut is disabled during this interview.");
    };
    const handleVisibility = () => {
      if (document.hidden) recordViolation("You left the interview tab. Return to fullscreen to continue.");
    };
    const handleBlur = () => recordViolation("The interview window lost focus. Other tabs and applications are not allowed.");
    const handleFullscreen = () => {
      if (fullscreenSupported && !document.fullscreenElement) recordViolation("Fullscreen mode was exited. Re-enter fullscreen to continue.");
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleClipboard);
    document.addEventListener("cut", handleClipboard);
    document.addEventListener("paste", handleClipboard);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleClipboard);
      document.removeEventListener("cut", handleClipboard);
      document.removeEventListener("paste", handleClipboard);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      window.removeEventListener("blur", handleBlur);
    };
  }, [fullscreenSupported, recordViolation]);

  async function resume() {
    try {
      if (fullscreenSupported && !document.fullscreenElement) await document.documentElement.requestFullscreen();
      setLocked(false);
      setReason("");
    } catch {
      setReason("Fullscreen permission was denied. Allow fullscreen mode to continue.");
    }
  }

  if (!locked) {
    return violations ? <div className="fixed left-3 top-20 z-40 rounded-full border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 shadow-lg" aria-live="polite">Integrity violations: {violations}</div> : null;
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="security-lock-title">
      <section className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700"><FiLock className="h-6 w-6" aria-hidden /></span>
        <h2 className="mt-5 text-2xl font-bold text-slate-950" id="security-lock-title">Interview paused</h2>
        <p className="mt-2 leading-6 text-slate-600">{reason}</p>
        <InterviewIntegrityChecklist />
        {violations > 0 ? <p className="mt-4 text-sm font-bold text-rose-700">Recorded violations: {violations}</p> : null}
        <button autoFocus className="mt-5 min-h-12 w-full rounded-xl bg-blue-600 px-5 font-semibold text-white outline-offset-2 hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700" onClick={() => void resume()} type="button">
          {fullscreenSupported ? "Enter fullscreen and continue" : "Acknowledge and continue"}
        </button>
      </section>
    </div>
  );
}

export function InterviewDeviceCheck({ onReadyChange }: DeviceCheckProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const [state, setState] = useState<CheckState>("idle");
  const [message, setMessage] = useState("Run the check before joining your interview.");
  const [audioLevel, setAudioLevel] = useState(0);

  const stopMedia = useCallback(() => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioContextRef.current) void audioContextRef.current.close();
    audioContextRef.current = null;
  }, []);

  useEffect(() => stopMedia, [stopMedia]);

  async function runCheck() {
    stopMedia();
    onReadyChange(false);
    setState("checking");
    setMessage("Requesting camera and microphone access…");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support camera and microphone checks.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        analyser.getByteFrequencyData(samples);
        const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
        setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      const cameraReady = stream.getVideoTracks().some((track) => track.readyState === "live");
      const microphoneReady = stream.getAudioTracks().some((track) => track.readyState === "live");
      if (!cameraReady || !microphoneReady) throw new Error("Camera and microphone must both be available.");

      setState("ready");
      setMessage("Camera and microphone are ready. Keep this tab open until the interview starts.");
      onReadyChange(true);
    } catch (error) {
      stopMedia();
      setState("error");
      setMessage(deviceErrorMessage(error));
      onReadyChange(false);
    }
  }

  function playSpeakerTest() {
    const context = audioContextRef.current ?? new AudioContext();
    if (!audioContextRef.current) audioContextRef.current = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 523.25;
    gain.gain.setValueAtTime(0.12, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.45);
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-950">System compatibility check</h2>
          <p className="mt-1 text-sm leading-5 text-slate-600">Available from your interview link up to 30 minutes before the scheduled start.</p>
        </div>
        <StatusIcon state={state} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
        <div className="aspect-video overflow-hidden rounded-xl bg-slate-950">
          <video aria-label="Camera preview" className="h-full w-full object-cover [transform:scaleX(-1)]" muted playsInline ref={videoRef} />
        </div>
        <div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <CheckItem icon={<FiCamera />} label="Camera" ready={state === "ready"} />
            <CheckItem icon={<FiMic />} label="Microphone" ready={state === "ready"} />
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200" aria-label={`Microphone level ${audioLevel}%`}>
            <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${audioLevel}%` }} />
          </div>
          <p className={`mt-3 text-xs leading-5 ${state === "error" ? "text-rose-700" : "text-slate-600"}`}>{message}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50" disabled={state === "checking"} onClick={() => void runCheck()} type="button">
          {state === "checking" ? <FiLoader className="animate-spin" aria-hidden /> : <FiCamera aria-hidden />}
          {state === "ready" ? "Run check again" : "Run system check"}
        </button>
        <button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100" onClick={playSpeakerTest} type="button">
          <FiVolume2 aria-hidden /> Test speaker
        </button>
      </div>
    </section>
  );
}

export function InterviewFaceMonitor({ interviewType, sessionId, token, websocketBaseUrl }: FaceMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<MonitorState>("connecting");
  const [message, setMessage] = useState("Starting identity monitoring…");

  useEffect(() => {
    let active = true;
    let captureTimer: number | undefined;
    let reconnectTimer: number | undefined;
    let stream: MediaStream | undefined;
    let socket: WebSocket | undefined;
    let awaitingResult = false;
    let reconnectAttempt = 0;

    const clearCaptureTimer = () => {
      if (captureTimer !== undefined) window.clearInterval(captureTimer);
      captureTimer = undefined;
    };

    const capture = () => {
      if (!active || !socket || socket.readyState !== WebSocket.OPEN || awaitingResult || socket.bufferedAmount > 256_000 || !videoRef.current) return;
      const video = videoRef.current;
      if (!video.videoWidth || !video.videoHeight) return;
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 640 / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob || !socket || socket.readyState !== WebSocket.OPEN) return;
        awaitingResult = true;
        socket.send(blob);
      }, "image/jpeg", 0.72);
    };

    const connect = () => {
      if (!active || !navigator.onLine) {
        setState("offline");
        setMessage("You are offline. Identity monitoring will reconnect automatically.");
        return;
      }

      setState("connecting");
      setMessage(reconnectAttempt ? "Reconnecting identity monitor…" : "Connecting identity monitor…");
      const wsBase = websocketBaseUrl.replace(/\/$/, "");
      socket = new WebSocket(`${wsBase}/api/${interviewType === "mcq" ? "mcq-interviews" : "coding-interviews"}/sessions/${encodeURIComponent(sessionId)}/face-stream?token=${encodeURIComponent(token)}`);

      socket.addEventListener("open", () => {
        if (!active) return;
        reconnectAttempt = 0;
        awaitingResult = false;
        setState("connecting");
        setMessage("Identity monitor connected. First check is running…");
        window.setTimeout(capture, 750);
        clearCaptureTimer();
        captureTimer = window.setInterval(capture, 20_000);
      });
      socket.addEventListener("message", (event) => {
        awaitingResult = false;
        const payload = safeJson(event.data);
        if (!payload) return;
        if (payload.success && payload.type === "verification") {
          setState("verified");
          setMessage("Identity verified");
        } else if (payload.type === "warning" || payload.success === false) {
          setState("warning");
          setMessage(payload.message ?? payload.error?.message ?? "Face could not be verified. Stay centered in the camera.");
        }
      });
      socket.addEventListener("close", (event) => {
        clearCaptureTimer();
        awaitingResult = false;
        if (!active || event.code === 1000) return;
        const retryDelay = Math.min(30_000, 2_000 * 2 ** reconnectAttempt);
        reconnectAttempt += 1;
        setState("offline");
        setMessage(`Identity monitor disconnected. Reconnecting in ${Math.ceil(retryDelay / 1000)} seconds…`);
        reconnectTimer = window.setTimeout(connect, retryDelay);
      });
      socket.addEventListener("error", () => {
        if (!active) return;
        setState("offline");
        setMessage("Identity monitoring connection failed. Reconnecting…");
      });
    };

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        });
        if (!active) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        connect();
      } catch (error) {
        if (!active) return;
        setState("offline");
        setMessage(deviceErrorMessage(error));
      }
    };

    const handleOnline = () => {
      if (!active || socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
      connect();
    };
    window.addEventListener("online", handleOnline);
    void start();
    return () => {
      active = false;
      clearCaptureTimer();
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
      window.removeEventListener("online", handleOnline);
      socket?.close(1000, "Interview view closed");
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [interviewType, sessionId, token, websocketBaseUrl]);

  const tone = state === "verified" ? "bg-emerald-500/15 text-emerald-300" : state === "warning" || state === "offline" ? "bg-amber-500/15 text-amber-200" : "bg-white/10 text-slate-200";

  return (
    <div className="fixed bottom-3 right-3 z-40 w-48 overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-2xl sm:bottom-5 sm:right-5" aria-live="polite">
      <video aria-label="Identity monitoring camera" className="aspect-video w-full object-cover [transform:scaleX(-1)]" muted playsInline ref={videoRef} />
      <div className={`flex items-start gap-2 px-3 py-2 text-[11px] leading-4 ${tone}`}>
        {state === "verified" ? <FiCheckCircle className="mt-0.5 shrink-0" aria-hidden /> : state === "connecting" ? <FiLoader className="mt-0.5 shrink-0 animate-spin" aria-hidden /> : <FiAlertTriangle className="mt-0.5 shrink-0" aria-hidden />}
        <span>{message}</span>
      </div>
    </div>
  );
}

function CheckItem({ icon, label, ready }: { icon: React.ReactNode; label: string; ready: boolean }) {
  return <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-slate-700"><span className={ready ? "text-emerald-600" : "text-slate-400"} aria-hidden>{icon}</span><span className="font-medium">{label}</span>{ready ? <FiCheckCircle className="ml-auto text-emerald-600" aria-hidden /> : null}</div>;
}

function StatusIcon({ state }: { state: CheckState }) {
  if (state === "checking") return <FiLoader className="h-5 w-5 animate-spin text-blue-600" aria-hidden />;
  if (state === "ready") return <FiCheckCircle className="h-5 w-5 text-emerald-600" aria-hidden />;
  if (state === "error") return <FiAlertTriangle className="h-5 w-5 text-rose-600" aria-hidden />;
  return <FiCamera className="h-5 w-5 text-slate-400" aria-hidden />;
}

function deviceErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "NotAllowedError") return "Camera or microphone permission was denied. Allow both permissions in your browser settings and retry.";
  if (error instanceof DOMException && error.name === "NotFoundError") return "A working camera and microphone were not found.";
  return error instanceof Error ? error.message : "The device check could not be completed.";
}

function safeJson(value: unknown): { success?: boolean; type?: string; message?: string; error?: { message?: string } } | null {
  try { return JSON.parse(String(value)); } catch { return null; }
}
