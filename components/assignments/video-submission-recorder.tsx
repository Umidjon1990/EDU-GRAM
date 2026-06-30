"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CircleStop, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { assignmentDictionary } from "@/i18n/locales/uz-Latn-UZ";

type VideoSubmissionRecorderProps = {
  onRecorded: (file: File) => void;
  maxSeconds?: number;
  recordedCount?: number;
  maxCount?: number;
};

type FaceDetectorCtor = new (options?: {
  fastMode?: boolean;
  maxDetectedFaces?: number;
}) => {
  detect: (source: HTMLVideoElement) => Promise<{ boundingBox: DOMRectReadOnly }[]>;
};

const t = assignmentDictionary.videoRecorder;
export function VideoSubmissionRecorder({
  maxCount = 1,
  maxSeconds = 60,
  onRecorded,
  recordedCount = 0,
}: VideoSubmissionRecorderProps) {
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<number | null>(null);
  const faceIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(maxSeconds);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [faceStatus, setFaceStatus] = useState<"ready" | "missing" | "lookingAway" | "unsupported">("unsupported");

  useEffect(() => {
    return () => {
      stopTimers();
      stopCamera();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        facingMode: "user",
        frameRate: { ideal: 18, max: 20 },
        height: { ideal: 360, max: 480 },
        width: { ideal: 360, max: 480 },
      },
    });

    streamRef.current = stream;
    if (previewRef.current) {
      previewRef.current.srcObject = stream;
      await previewRef.current.play();
    }

    setCameraReady(true);
    startFaceControl();
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;

    chunksRef.current = [];
    setSecondsLeft(maxSeconds);
    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 64000,
      videoBitsPerSecond: 420000,
    });

    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const file = new File([blob], `video-javob-${Date.now()}.webm`, {
        type: mimeType,
      });
      onRecorded(file);
      const nextUrl = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(nextUrl);
      setRecording(false);
      stopTimers();
    };

    recorder.start(1000);
    setRecording(true);
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          stopRecording();
          return 0;
        }

        return current - 1;
      });
    }, 1000);
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  async function startFaceControl() {
    const FaceDetector = (window as unknown as { FaceDetector?: FaceDetectorCtor })
      .FaceDetector;

    if (!FaceDetector || !previewRef.current) {
      setFaceStatus("unsupported");
      return;
    }

    const detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
    faceIntervalRef.current = window.setInterval(async () => {
      const video = previewRef.current;
      if (!video || video.readyState < 2) return;

      try {
        const faces = await detector.detect(video);
        const face = faces[0];
        if (!face) {
          setFaceStatus("missing");
          return;
        }

        const centerX = face.boundingBox.x + face.boundingBox.width / 2;
        const videoCenter = video.videoWidth / 2;
        const distance = Math.abs(centerX - videoCenter);
        setFaceStatus(distance > video.videoWidth * 0.22 ? "lookingAway" : "ready");
      } catch {
        setFaceStatus("unsupported");
      }
    }, 1200);
  }

  function stopTimers() {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (faceIntervalRef.current) window.clearInterval(faceIntervalRef.current);
    intervalRef.current = null;
    faceIntervalRef.current = null;
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  const faceControlBlocksRecording = faceStatus === "missing" || faceStatus === "lookingAway";
  const limitReached = recordedCount >= maxCount;

  return (
    <section className="grid gap-4 rounded-3xl border border-border bg-muted p-4">
      <div>
        <h3 className="font-black">{t.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
        <p className="mt-1 text-xs font-bold text-muted-foreground">{t.compressed}</p>
        <p className="mt-1 text-xs font-bold text-muted-foreground">
          {recordedCount}/{maxCount}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[12rem_1fr] sm:items-center">
        <div className="mx-auto aspect-square w-44 overflow-hidden rounded-full border-4 border-background bg-background shadow-sm">
          <video
            className="size-full object-cover"
            muted
            playsInline
            ref={previewRef}
          />
        </div>

        <div className="grid gap-3">
          <span className={getStatusClass(faceStatus)}>
            {getStatusLabel(faceStatus)}
          </span>
          <span className="rounded-2xl bg-background px-3 py-2 text-sm font-black text-muted-foreground">
            {t.secondsLeft.replace("{seconds}", String(secondsLeft))}
          </span>

          <div className="flex flex-wrap gap-2">
            <Button onClick={startCamera} type="button" variant="secondary">
              <Camera aria-hidden className="size-4" />
              {t.startCamera}
            </Button>
            {recording ? (
              <Button onClick={stopRecording} type="button" variant="secondary">
                <CircleStop aria-hidden className="size-4" />
                {t.stopRecording}
              </Button>
            ) : (
              <Button
                disabled={!cameraReady || faceControlBlocksRecording || limitReached}
                onClick={startRecording}
                type="button"
              >
                <Video aria-hidden className="size-4" />
                {t.startRecording}
              </Button>
            )}
          </div>
        </div>
      </div>

      {previewUrl ? (
        <div className="grid gap-2">
          <p className="text-sm font-black text-success">{t.ready}</p>
          <video className="w-full rounded-2xl" controls src={previewUrl} />
        </div>
      ) : null}
    </section>
  );
}

function getSupportedMimeType() {
  const options = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  return options.find((type) => MediaRecorder.isTypeSupported(type)) ?? "video/webm";
}

function getStatusLabel(status: "ready" | "missing" | "lookingAway" | "unsupported") {
  if (status === "ready") return t.faceReady;
  if (status === "missing") return t.faceMissing;
  if (status === "lookingAway") return t.lookAtCamera;
  return t.unsupported;
}

function getStatusClass(status: "ready" | "missing" | "lookingAway" | "unsupported") {
  if (status === "ready") {
    return "rounded-2xl bg-success/10 px-3 py-2 text-sm font-black text-success";
  }

  if (status === "unsupported") {
    return "rounded-2xl bg-background px-3 py-2 text-sm font-black text-muted-foreground";
  }

  return "rounded-2xl bg-danger/10 px-3 py-2 text-sm font-black text-danger";
}
