"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Download, Mic, Paperclip, SendHorizonal, Square } from "lucide-react";

import {
  createMessageAction,
  type MessageActionState,
} from "@/features/messages/actions";
import { pinMessageAction, unpinMessageAction } from "@/features/announcements/actions";
import { Button } from "@/components/ui/button";
import { chatDictionary } from "@/i18n/locales/uz-Latn-UZ";

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
  };
  attachments: {
    id: string;
    kind: "FILE" | "AUDIO";
    originalName: string;
    mimeType: string;
    size: number;
  }[];
  pinned?: boolean;
};

type ChatPanelProps = {
  canPin?: boolean;
  currentUserId: string;
  groupId: string;
  initialMessages: ChatMessage[];
};

const initialState: MessageActionState = {
  status: "idle",
};

const t = chatDictionary;

export function ChatPanel({
  canPin = false,
  currentUserId,
  groupId,
  initialMessages,
}: ChatPanelProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [streamStatus, setStreamStatus] =
    useState<keyof typeof t.streamStatus>("connecting");
  const [state, formAction, isPending] = useActionState(
    createMessageAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordingState, setRecordingState] = useState<
    "idle" | "recording" | "ready"
  >("idle");

  const streamUrl = useMemo(
    () => `/api/groups/${groupId}/messages/stream`,
    [groupId],
  );

  useEffect(() => {
    const eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => setStreamStatus("connected");
    eventSource.onerror = () => setStreamStatus("disconnected");
    eventSource.onmessage = (event) => {
      const nextMessages = JSON.parse(event.data) as ChatMessage[];
      setMessages(nextMessages);
    };

    return () => eventSource.close();
  }, [streamUrl]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    audioChunksRef.current = [];
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
        type: mimeType,
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(audioFile);

      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
      }

      stream.getTracks().forEach((track) => track.stop());
      setRecordingState("ready");
    };

    recorder.start();
    setRecordingState("recording");
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  return (
    <section className="grid min-h-[34rem] overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-2xl font-black">{t.title}</h2>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {t.streamStatus[streamStatus]}
          </p>
        </div>
        <span className="rounded-full bg-success/10 px-3 py-1 text-sm font-bold text-success">
          {t.live}
        </span>
      </div>

      <div className="max-h-[55vh] min-h-[24rem] overflow-y-auto px-4 py-5">
        {messages.length === 0 ? (
          <p className="rounded-2xl bg-muted px-4 py-5 text-muted-foreground">
            {t.empty}
          </p>
        ) : (
          <div className="grid gap-3">
            {messages.map((message) => {
              const own = message.sender.id === currentUserId;

              return (
                <article
                  className={
                    own
                      ? "ml-auto max-w-[86%] rounded-3xl bg-primary px-4 py-3 text-primary-foreground sm:max-w-[70%]"
                      : "mr-auto max-w-[86%] rounded-3xl bg-muted px-4 py-3 sm:max-w-[70%]"
                  }
                  key={message.id}
                >
                  <div className="mb-1 flex items-center justify-between gap-4 text-xs font-bold opacity-75">
                    <span>{message.sender.fullName}</span>
                    <time>{formatTime(message.createdAt)}</time>
                  </div>
                  <p className="whitespace-pre-wrap leading-7">{message.body}</p>
                  {message.attachments.length > 0 ? (
                    <div className="mt-3 grid gap-2">
                      {message.attachments.map((attachment) => (
                        <div
                          className={
                            own
                              ? "rounded-2xl bg-white/15 p-3"
                              : "rounded-2xl bg-background p-3"
                          }
                          key={attachment.id}
                        >
                          {attachment.kind === "AUDIO" ? (
                            <audio
                              className="w-full"
                              controls
                              preload="none"
                              src={`/api/files/${attachment.id}`}
                            >
                              {t.playAudio}
                            </audio>
                          ) : null}
                          <a
                            className="mt-2 flex items-center justify-between gap-3 text-sm font-bold"
                            href={`/api/files/${attachment.id}`}
                          >
                            <span className="min-w-0 truncate">
                              {attachment.originalName}
                            </span>
                            <span className="flex shrink-0 items-center gap-1">
                              {formatSize(attachment.size)}
                              <Download aria-hidden className="size-4" />
                            </span>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {canPin ? (
                    <form
                      action={message.pinned ? unpinMessageAction : pinMessageAction}
                      className="mt-2"
                    >
                      <input name="groupId" type="hidden" value={groupId} />
                      <input name="messageId" type="hidden" value={message.id} />
                      <button
                        className="text-xs font-bold opacity-75 hover:opacity-100"
                        type="submit"
                      >
                        {message.pinned ? t.unpin : t.pin}
                      </button>
                    </form>
                  ) : null}
                </article>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form
        action={formAction}
        className="grid gap-3 border-t border-border p-4 sm:grid-cols-[1fr_auto]"
        ref={formRef}
      >
        <input name="groupId" type="hidden" value={groupId} />
        <label className="sr-only" htmlFor="body">
          {t.inputLabel}
        </label>
        <textarea
          className="min-h-12 resize-none rounded-2xl border border-border bg-background px-4 py-3 outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          id="body"
          name="body"
          placeholder={t.inputPlaceholder}
        />
        <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-bold text-muted-foreground transition hover:bg-muted sm:col-span-2">
          <Paperclip aria-hidden className="size-4" />
          {t.attachment}
          <span className="font-medium">({t.attachmentHint})</span>
          <input
            accept="application/pdf,image/jpeg,image/png,image/webp,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,audio/*"
            className="sr-only"
            name="attachment"
            ref={fileInputRef}
            type="file"
          />
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          {recordingState === "recording" ? (
            <Button onClick={stopRecording} type="button" variant="secondary">
              <Square aria-hidden className="size-4" />
              {t.stopRecording}
            </Button>
          ) : (
            <Button onClick={startRecording} type="button" variant="secondary">
              <Mic aria-hidden className="size-4" />
              {t.recordVoice}
            </Button>
          )}
          {recordingState === "ready" ? (
            <span className="inline-flex h-11 items-center rounded-2xl bg-success/10 px-3 text-sm font-bold text-success">
              {t.voiceReady}
            </span>
          ) : null}
        </div>
        <Button disabled={isPending} type="submit">
          {isPending ? t.sending : t.send}
          <SendHorizonal aria-hidden className="size-4" />
        </Button>
        {state.status === "error" && state.message ? (
          <p className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger sm:col-span-2">
            {state.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}

function formatSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("uz-Latn-UZ", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  }).format(new Date(value));
}
