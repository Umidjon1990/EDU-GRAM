"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { assignmentDictionary } from "@/i18n/locales/uz-Latn-UZ";

type AudioSubmissionRecorderProps = {
  maxCount: number;
  maxSeconds: number;
  onRecorded: (file: File) => void;
  recordedCount: number;
};

const t = assignmentDictionary.audioRecorder;

export function AudioSubmissionRecorder({
  maxCount,
  maxSeconds,
  onRecorded,
  recordedCount,
}: AudioSubmissionRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(maxSeconds);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    if (recordedCount >= maxCount) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 48000,
    });

    streamRef.current = stream;
    chunksRef.current = [];
    mediaRecorderRef.current = recorder;
    setSecondsLeft(maxSeconds);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const extension = mimeType.includes("mp4") ? "m4a" : "webm";
      onRecorded(
        new File([blob], `audio-javob-${Date.now()}.${extension}`, {
          type: mimeType,
        }),
      );
      setRecording(false);
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };

    recorder.start(1000);
    setRecording(true);
    timerRef.current = window.setInterval(() => {
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

  return (
    <section className="grid gap-3 rounded-3xl border border-border bg-muted p-4">
      <div>
        <h3 className="font-black">{t.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.description
            .replace("{seconds}", String(maxSeconds))
            .replace("{count}", String(maxCount))}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-2xl bg-background px-3 py-2 text-sm font-black text-muted-foreground">
          {t.secondsLeft.replace("{seconds}", String(secondsLeft))}
        </span>
        <span className="rounded-2xl bg-background px-3 py-2 text-sm font-black text-muted-foreground">
          {recordedCount}/{maxCount}
        </span>
        {recording ? (
          <Button onClick={stopRecording} type="button" variant="secondary">
            <VoiceWave />
            <Square aria-hidden className="size-4" />
            {t.stop}
          </Button>
        ) : (
          <Button
            disabled={recordedCount >= maxCount}
            onClick={startRecording}
            type="button"
          >
            <Mic aria-hidden className="size-4" />
            {t.start}
          </Button>
        )}
      </div>
    </section>
  );
}

function VoiceWave() {
  return (
    <span className="flex h-6 items-center gap-1">
      {[0, 1, 2, 3].map((item) => (
        <span
          className="h-3 w-1 rounded-full bg-current animate-[voice-wave_0.9s_ease-in-out_infinite]"
          key={item}
          style={{ animationDelay: `${item * 90}ms` }}
        />
      ))}
    </span>
  );
}

function getSupportedMimeType() {
  const options = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ];

  return options.find((type) => MediaRecorder.isTypeSupported(type)) ?? "audio/webm";
}
