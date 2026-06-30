"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { FileText, X } from "lucide-react";

import { AudioSubmissionRecorder } from "@/components/assignments/audio-submission-recorder";
import { submitAssignmentAction, type AssignmentState } from "@/features/assignments/actions";
import { VideoSubmissionRecorder } from "@/components/assignments/video-submission-recorder";
import { Button } from "@/components/ui/button";
import { assignmentDictionary } from "@/i18n/locales/uz-Latn-UZ";

const t = assignmentDictionary;
const initialState: AssignmentState = { status: "idle" };

export function StudentSubmitForm({
  audioMaxSeconds = 180,
  assignmentId,
  maxAttachmentCount = 1,
  responseMode = "TEXT",
  videoMaxSeconds = 60,
}: {
  audioMaxSeconds?: number;
  assignmentId: string;
  maxAttachmentCount?: number;
  responseMode?: "TEXT" | "AUDIO" | "IMAGE" | "VIDEO" | "FILE";
  videoMaxSeconds?: number;
}) {
  const [state, formAction, isPending] = useActionState(submitAssignmentAction, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const accept = getAccept(responseMode);

  useEffect(() => {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));

    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
    }
  }, [files]);

  function addFiles(nextFiles: File[]) {
    setFiles((current) => {
      const merged = [...current, ...nextFiles].slice(0, maxAttachmentCount);
      return merged;
    });
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function attachRecordedFile(file: File) {
    addFiles([file]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    formData.delete("attachments");
    files.forEach((file) => formData.append("attachments", file));

    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
      <input name="assignmentId" type="hidden" value={assignmentId} />
      <textarea className="min-h-24 rounded-2xl border border-border bg-background px-4 py-3" name="body" placeholder={t.answerPlaceholder} />
      {responseMode === "AUDIO" ? (
        <AudioSubmissionRecorder
          maxCount={maxAttachmentCount}
          maxSeconds={audioMaxSeconds}
          onRecorded={attachRecordedFile}
          recordedCount={files.length}
        />
      ) : null}
      {responseMode === "VIDEO" ? (
        <VideoSubmissionRecorder
          maxCount={maxAttachmentCount}
          maxSeconds={videoMaxSeconds}
          onRecorded={attachRecordedFile}
          recordedCount={files.length}
        />
      ) : null}
      <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-border bg-background px-4 py-3 text-sm font-black text-muted-foreground hover:bg-muted">
        {t.fileAttachment} ({files.length}/{maxAttachmentCount})
        <input
          accept={accept}
          className="sr-only"
          multiple
          name="attachments"
          onChange={handleFileSelect}
          ref={fileInputRef}
          type="file"
        />
      </label>
      {files.length > 0 ? (
        <div className="grid gap-2 rounded-2xl bg-muted p-3">
          {files.map((file, index) => (
            <div
              className="flex items-center justify-between gap-3 rounded-2xl bg-background px-3 py-2 text-sm"
              key={`${file.name}-${file.lastModified}-${index}`}
            >
              <span className="flex min-w-0 items-center gap-2 font-bold">
                <FileText aria-hidden className="size-4 shrink-0 text-primary" />
                <span className="truncate">{file.name}</span>
              </span>
              <button
                aria-label={t.removeAttachment}
                className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
                onClick={() => removeFile(index)}
                type="button"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {isPending ? (
        <div className="rounded-2xl bg-primary/10 p-3">
          <p className="text-sm font-black text-primary">{t.uploading}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))]" />
          </div>
        </div>
      ) : null}
      <Button disabled={isPending} type="submit">{isPending ? t.submitting : t.submit}</Button>
      {state.message ? <p className="text-sm font-bold text-primary">{state.message}</p> : null}
    </form>
  );
}

function getAccept(responseMode: string) {
  if (responseMode === "AUDIO") return "audio/*";
  if (responseMode === "IMAGE") return "image/jpeg,image/png,image/webp";
  if (responseMode === "VIDEO") return "video/mp4,video/webm,video/quicktime";
  return "application/pdf,image/jpeg,image/png,image/webp,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,audio/*,video/mp4,video/webm,video/quicktime";
}
