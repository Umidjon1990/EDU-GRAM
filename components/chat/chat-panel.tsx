"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import {
  Download,
  FileText,
  Mic,
  Paperclip,
  Search,
  SendHorizonal,
  Square,
} from "lucide-react";

import {
  createMessageAction,
  createAssignmentFromMessageAction,
  deleteMessageAction,
  editMessageAction,
  type MessageActionState,
  toggleMessageReactionAction,
} from "@/features/messages/actions";
import { pinMessageAction, unpinMessageAction } from "@/features/announcements/actions";
import { Button } from "@/components/ui/button";
import { chatDictionary } from "@/i18n/locales/uz-Latn-UZ";

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  replyTo: {
    id: string;
    body: string;
    sender: {
      fullName: string;
    };
  } | null;
  sender: {
    id: string;
    fullName: string;
  };
  attachments: {
    id: string;
    kind: "FILE" | "AUDIO" | "IMAGE" | "VIDEO";
    originalName: string;
    mimeType: string;
    size: number;
  }[];
  reactions: {
    emoji: string;
    count: number;
    reactedByMe: boolean;
  }[];
  readReceipts: {
    userId: string;
    fullName: string;
    readAt: string;
  }[];
  seenByMe: boolean;
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
const reactionPresets = ["\u{1F44D}", "\u{2705}", "\u{2753}", "\u{1F44F}", "\u{1F525}"] as const;

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
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "media">("all");

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

  const filteredMessages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const scopedMessages =
      viewMode === "media"
        ? messages.filter((message) => message.attachments.length > 0)
        : messages;

    if (!normalizedQuery) {
      return scopedMessages;
    }

    return scopedMessages.filter((message) => {
      const haystack = [
        message.body,
        message.sender.fullName,
        ...message.attachments.map((attachment) => attachment.originalName),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [messages, query, viewMode]);

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

  function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    formRef.current?.requestSubmit();
  }

  return (
    <section className="flex min-h-[38rem] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm lg:h-[calc(100dvh-15rem)] xl:h-[calc(100dvh-13rem)]">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-xl font-black sm:text-2xl">{t.title}</h2>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {t.streamStatus[streamStatus]}
          </p>
        </div>
        <span className="rounded-full bg-success/10 px-3 py-1 text-sm font-bold text-success">
          {t.live}
        </span>
      </div>

      <div className="grid shrink-0 gap-3 border-b border-border bg-card px-3 py-3 md:grid-cols-[1fr_auto] sm:px-4">
        <label className="relative block">
          <span className="sr-only">{t.searchPlaceholder}</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-sm font-semibold outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.searchPlaceholder}
            value={query}
          />
        </label>
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
          <button
            className={
              viewMode === "all"
                ? "rounded-xl bg-card px-3 py-2 text-sm font-black shadow-sm"
                : "rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground"
            }
            onClick={() => setViewMode("all")}
            type="button"
          >
            {t.allMessages}
          </button>
          <button
            className={
              viewMode === "media"
                ? "rounded-xl bg-card px-3 py-2 text-sm font-black shadow-sm"
                : "rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground"
            }
            onClick={() => setViewMode("media")}
            type="button"
          >
            {t.mediaFiles}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4 lg:px-5">
        {messages.length === 0 ? (
          <p className="rounded-2xl bg-muted px-4 py-5 text-muted-foreground">
            {t.empty}
          </p>
        ) : filteredMessages.length === 0 ? (
          <p className="rounded-2xl bg-muted px-4 py-5 text-muted-foreground">
            {t.noSearchResults}
          </p>
        ) : (
          <div className="grid gap-3 pb-2">
            {filteredMessages.map((message) => {
              const own = message.sender.id === currentUserId;
              const canDelete = own || canPin;
              const isEditing = editingId === message.id;
              const firstUrl = getFirstUrl(message.body);

              return (
                <article
                  className={
                    own
                      ? "group/message ml-auto max-w-[92%] rounded-3xl bg-primary px-4 py-3 text-primary-foreground sm:max-w-[78%] xl:max-w-[46rem]"
                      : "group/message mr-auto max-w-[92%] rounded-3xl bg-muted px-4 py-3 sm:max-w-[78%] xl:max-w-[46rem]"
                  }
                  key={message.id}
                >
                  <div className="mb-1 flex items-center justify-between gap-4 text-xs font-bold opacity-75">
                    <span>{message.sender.fullName}</span>
                    <time>{formatTime(message.createdAt)}</time>
                  </div>
                  {message.replyTo ? (
                    <button
                      className={
                        own
                          ? "mb-2 block w-full rounded-2xl bg-white/15 px-3 py-2 text-left text-xs"
                          : "mb-2 block w-full rounded-2xl bg-background px-3 py-2 text-left text-xs"
                      }
                      onClick={() => setReplyTo(message)}
                      type="button"
                    >
                      <span className="block font-black">{message.replyTo.sender.fullName}</span>
                      <span className="mt-1 line-clamp-2 opacity-80">{message.replyTo.body}</span>
                    </button>
                  ) : null}
                  {isEditing ? (
                    <form action={editMessageAction} className="grid gap-2">
                      <input name="messageId" type="hidden" value={message.id} />
                      <textarea
                        className="min-h-20 rounded-2xl border border-border bg-background px-3 py-2 text-foreground outline-none"
                        defaultValue={message.body}
                        name="body"
                        required
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button size="md" type="submit">
                          {t.saveEdit}
                        </Button>
                        <Button
                          onClick={() => setEditingId(null)}
                          type="button"
                          variant="secondary"
                        >
                          {t.cancel}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap break-words text-[0.97rem] leading-7">{message.body}</p>
                      {firstUrl ? (
                        <a
                          className={
                            own
                              ? "mt-3 block rounded-2xl bg-white/15 px-3 py-2 text-sm font-bold"
                              : "mt-3 block rounded-2xl bg-background px-3 py-2 text-sm font-bold"
                          }
                          href={firstUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <span className="block text-xs opacity-75">{t.linkPreview}</span>
                          <span className="mt-1 block truncate">{formatHost(firstUrl)}</span>
                          <span className="mt-1 block text-xs opacity-75">{t.openLink}</span>
                        </a>
                      ) : null}
                    </>
                  )}
                  {message.editedAt ? (
                    <p className="mt-1 text-xs font-semibold opacity-70">{t.edited}</p>
                  ) : null}
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
                            <>
                              <audio
                                className="w-full"
                                controls
                                data-audio-id={attachment.id}
                                preload="none"
                                src={`/api/files/${attachment.id}`}
                              >
                                {t.playAudio}
                              </audio>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-black">
                                <span className="opacity-75">{t.audioSpeed}</span>
                                {[1, 1.5, 2].map((speed) => (
                                  <button
                                    className="rounded-full bg-background/80 px-2 py-1 text-foreground"
                                    key={speed}
                                    onClick={() => setAudioRate(attachment.id, speed)}
                                    type="button"
                                  >
                                    {speed}x
                                  </button>
                                ))}
                              </div>
                            </>
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
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {reactionPresets.map((emoji) => {
                      const reaction = message.reactions.find((item) => item.emoji === emoji);
                      return (
                        <form action={toggleMessageReactionAction} key={emoji}>
                          <input name="messageId" type="hidden" value={message.id} />
                          <input name="emoji" type="hidden" value={emoji} />
                          <button
                            aria-label={`${t.reactions}: ${emoji}`}
                            className={
                              reaction?.reactedByMe
                                ? "rounded-full bg-background px-2 py-1 text-xs font-black text-foreground shadow-sm"
                                : "rounded-full bg-background/50 px-2 py-1 text-xs font-bold"
                            }
                            type="submit"
                          >
                            {emoji}
                            {reaction ? (
                              <span className="ml-1 text-xs">{reaction.count}</span>
                            ) : null}
                          </button>
                        </form>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold opacity-75">
                    {own ? <span>{message.seenByMe ? t.seen : t.notSeenYet}</span> : null}
                    {canPin ? (
                      <span className="max-w-full truncate" title={message.readReceipts.map((receipt) => receipt.fullName).join(", ")}>
                        {t.seenBy}:{" "}
                        {message.readReceipts.length > 0
                          ? message.readReceipts.map((receipt) => receipt.fullName).join(", ")
                          : t.notSeenYet}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-80 transition group-hover/message:opacity-100">
                    <button
                      className="font-bold hover:opacity-100"
                      onClick={() => setReplyTo(message)}
                      type="button"
                    >
                      {t.reply}
                    </button>
                    {own ? (
                      <button
                        className="font-bold hover:opacity-100"
                        onClick={() => setEditingId(message.id)}
                        type="button"
                      >
                        {t.edit}
                      </button>
                    ) : null}
                    {canDelete ? (
                      <form action={deleteMessageAction}>
                        <input name="messageId" type="hidden" value={message.id} />
                        <button
                          className="font-bold hover:opacity-100"
                          type="submit"
                        >
                          {t.delete}
                        </button>
                      </form>
                    ) : null}
                    {canPin ? (
                      <form action={message.pinned ? unpinMessageAction : pinMessageAction}>
                        <input name="groupId" type="hidden" value={groupId} />
                        <input name="messageId" type="hidden" value={message.id} />
                        <button
                          className="font-bold hover:opacity-100"
                          type="submit"
                        >
                          {message.pinned ? t.unpin : t.pin}
                        </button>
                      </form>
                    ) : null}
                    {canPin ? (
                      <form action={createAssignmentFromMessageAction}>
                        <input name="messageId" type="hidden" value={message.id} />
                        <button
                          className="inline-flex items-center gap-1 font-bold hover:opacity-100"
                          type="submit"
                        >
                          <FileText aria-hidden className="size-3.5" />
                          {t.makeAssignment}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </article>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form
        action={formAction}
        className="grid shrink-0 gap-3 border-t border-border bg-card/95 p-3 backdrop-blur sm:grid-cols-[1fr_auto] sm:p-4"
        onSubmit={() => setReplyTo(null)}
        ref={formRef}
      >
        <input name="groupId" type="hidden" value={groupId} />
        <input name="replyToId" type="hidden" value={replyTo?.id ?? ""} />
        {replyTo ? (
          <div className="rounded-2xl bg-muted px-4 py-3 sm:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-primary">{t.replyingTo}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  <b>{replyTo.sender.fullName}:</b> {replyTo.body}
                </p>
              </div>
              <button
                className="text-xs font-bold text-muted-foreground"
                onClick={() => setReplyTo(null)}
                type="button"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        ) : null}
        <label className="sr-only" htmlFor="body">
          {t.inputLabel}
        </label>
        <textarea
          className="max-h-32 min-h-12 resize-none rounded-2xl border border-border bg-background px-4 py-3 outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          id="body"
          name="body"
          onKeyDown={submitOnEnter}
          placeholder={t.inputPlaceholder}
        />
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-bold text-muted-foreground transition hover:bg-muted sm:col-span-2 lg:col-span-1">
          <Paperclip aria-hidden className="size-4" />
          {t.attachment}
          <span className="font-medium">({t.attachmentHint})</span>
          <input
            accept="application/pdf,image/jpeg,image/png,image/webp,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,audio/*,video/mp4,video/webm,video/quicktime"
            className="sr-only"
            name="attachment"
            ref={fileInputRef}
            type="file"
          />
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1 lg:justify-end">
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
        <Button className="sm:row-start-1 sm:col-start-2" disabled={isPending} type="submit">
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

function getFirstUrl(text: string) {
  return text.match(/https?:\/\/[^\s]+/i)?.[0] ?? null;
}

function formatHost(value: string) {
  try {
    const url = new URL(value);
    return url.hostname;
  } catch {
    return value;
  }
}

function setAudioRate(attachmentId: string, speed: number) {
  const audio = document.querySelector<HTMLAudioElement>(
    `audio[data-audio-id="${attachmentId}"]`,
  );
  if (audio) {
    audio.playbackRate = speed;
  }
}
