"use client";

import { useActionState, useRef } from "react";
import { submitAssignmentAction, type AssignmentState } from "@/features/assignments/actions";
import { VideoSubmissionRecorder } from "@/components/assignments/video-submission-recorder";
import { Button } from "@/components/ui/button";
import { assignmentDictionary } from "@/i18n/locales/uz-Latn-UZ";

const t = assignmentDictionary;
const initialState: AssignmentState = { status: "idle" };

export function StudentSubmitForm({
  assignmentId,
  responseMode = "TEXT",
}: {
  assignmentId: string;
  responseMode?: "TEXT" | "AUDIO" | "IMAGE" | "VIDEO" | "FILE";
}) {
  const [state, formAction, isPending] = useActionState(submitAssignmentAction, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accept = getAccept(responseMode);

  function attachRecordedVideo(file: File) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
    }
  }

  return (
    <form action={formAction} className="mt-4 grid gap-3">
      <input name="assignmentId" type="hidden" value={assignmentId} />
      <textarea className="min-h-24 rounded-2xl border border-border bg-background px-4 py-3" name="body" placeholder={t.answerPlaceholder} />
      {responseMode === "VIDEO" ? (
        <VideoSubmissionRecorder onRecorded={attachRecordedVideo} />
      ) : null}
      <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-border bg-background px-4 py-3 text-sm font-black text-muted-foreground hover:bg-muted">
        {t.fileAttachment}
        <input
          accept={accept}
          className="sr-only"
          name="attachment"
          ref={fileInputRef}
          type="file"
        />
      </label>
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
