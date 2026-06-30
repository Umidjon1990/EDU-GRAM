import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { FileAssetKind } from "@prisma/client";

const MAX_UPLOAD_SIZE = 40 * 1024 * 1024;
const storageRoot = path.join(process.cwd(), "storage", "uploads");

const allowedDocumentTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedVideoTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export type StoredFile = {
  kind: FileAssetKind;
  storageKey: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export async function storeUploadedFile(file: File): Promise<StoredFile | null> {
  if (!file || file.size === 0) {
    return null;
  }

  const kind = getFileKind(file.type);

  if (file.size > MAX_UPLOAD_SIZE || !isAllowedMimeType(file.type, kind)) {
    throw new Error("INVALID_FILE");
  }

  const extension = getSafeExtension(file.name);
  const storageKey = `${new Date().getFullYear()}/${randomUUID()}${extension}`;
  const absolutePath = getStoragePath(storageKey);
  const buffer = Buffer.from(await file.arrayBuffer());

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);

  return {
    kind,
    storageKey,
    originalName: sanitizeFilename(file.name),
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  };
}

export async function readStoredFile(storageKey: string) {
  return readFile(getStoragePath(storageKey));
}

export async function deleteStoredFile(storageKey: string) {
  try {
    await unlink(getStoragePath(storageKey));
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") {
      return;
    }

    throw error;
  }
}

function getStoragePath(storageKey: string) {
  const normalizedKey = storageKey.replaceAll("\\", "/");
  const absolutePath = path.resolve(storageRoot, normalizedKey);

  if (!absolutePath.startsWith(storageRoot + path.sep)) {
    throw new Error("INVALID_STORAGE_KEY");
  }

  return absolutePath;
}

function getFileKind(mimeType: string) {
  if (mimeType.startsWith("audio/")) return FileAssetKind.AUDIO;
  if (mimeType.startsWith("image/")) return FileAssetKind.IMAGE;
  if (mimeType.startsWith("video/")) return FileAssetKind.VIDEO;
  return FileAssetKind.FILE;
}

function isAllowedMimeType(mimeType: string, kind: FileAssetKind) {
  if (kind === FileAssetKind.AUDIO) {
    return mimeType.startsWith("audio/");
  }
  if (kind === FileAssetKind.IMAGE) {
    return allowedImageTypes.has(mimeType);
  }
  if (kind === FileAssetKind.VIDEO) {
    return allowedVideoTypes.has(mimeType);
  }

  return allowedDocumentTypes.has(mimeType);
}

function getSafeExtension(filename: string) {
  const extension = path.extname(filename).toLowerCase();

  if (!extension || extension.length > 12) {
    return "";
  }

  return extension.replace(/[^a-z0-9.]/g, "");
}

function sanitizeFilename(filename: string) {
  return (
    filename
      .replaceAll("\\", "-")
      .replaceAll("/", "-")
      .replace(/[^\w.\- ()]/g, "")
      .trim()
      .slice(0, 160) || "file"
  );
}
