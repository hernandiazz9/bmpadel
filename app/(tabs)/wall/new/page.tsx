"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { PostMedia } from "@/components/wall/post-media";
import { Button } from "@/components/ui/button";
import { MediaTooLargeError, uploadMedia } from "@/lib/media";
import { strings } from "@/lib/strings";
import type { MediaType } from "@/lib/types";
import { createPost, mediaTypeFromUrl } from "@/lib/wall";

export default function NewPostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);

  const [body, setBody] = useState("");
  const [media, setMedia] = useState<{ url: string; type: MediaType } | null>(null);
  const [pastedUrl, setPastedUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only the coach posts (ADR-006). The link into here is coach-only too, so
  // this is the belt to that braces.
  if (user && user.role !== "coach") {
    router.replace("/wall");
    return null;
  }

  async function onPickFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      setMedia(await uploadMedia(file));
      setPastedUrl("");
    } catch (uploadError) {
      setError(
        uploadError instanceof MediaTooLargeError
          ? strings.compose.uploadFailed
          : strings.compose.uploadFailed,
      );
    } finally {
      setUploading(false);
    }
  }

  async function onPublish() {
    if (!user) return;
    const text = body.trim();
    if (!text) {
      setError(strings.compose.bodyRequired);
      return;
    }

    // A pasted link wins only if nothing was uploaded — the escape hatch for
    // when the venue wifi will not carry a video.
    const chosen =
      media ??
      (pastedUrl.trim()
        ? { url: pastedUrl.trim(), type: mediaTypeFromUrl(pastedUrl.trim()) }
        : null);

    setPublishing(true);
    setError(null);
    try {
      await createPost(user.id, text, chosen?.url ?? null, chosen?.type ?? null);
      router.replace("/wall");
    } catch {
      setError(strings.compose.uploadFailed);
      setPublishing(false);
    }
  }

  const preview =
    media ??
    (pastedUrl.trim()
      ? { url: pastedUrl.trim(), type: mediaTypeFromUrl(pastedUrl.trim()) }
      : null);

  return (
    <div className="pt-10 pb-4">
      <Link
        href="/wall"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {strings.nav.wall}
      </Link>

      <h1 className="headline mt-6 text-3xl">{strings.compose.postTitle}</h1>

      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={strings.compose.body}
        rows={5}
        className="mt-6 w-full resize-none rounded-lg border border-input bg-card px-4 py-3 text-[15px] outline-none focus-visible:border-ring"
      />

      <input
        ref={fileInput}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onPickFile(file);
          event.target.value = "";
        }}
      />

      <div className="mt-4 flex gap-2">
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          disabled={uploading || publishing}
          onClick={() => fileInput.current?.click()}
        >
          {uploading
            ? strings.compose.uploading
            : media
              ? strings.compose.replaceMedia
              : strings.compose.addMedia}
        </Button>
        {preview ? (
          <Button
            size="lg"
            variant="ghost"
            disabled={publishing}
            onClick={() => {
              setMedia(null);
              setPastedUrl("");
            }}
          >
            {strings.compose.removeMedia}
          </Button>
        ) : null}
      </div>

      {!media ? (
        <div className="mt-4">
          <label
            htmlFor="media-url"
            className="text-xs text-muted-foreground"
          >
            {strings.compose.orPasteUrl}
          </label>
          <input
            id="media-url"
            type="url"
            value={pastedUrl}
            onChange={(event) => setPastedUrl(event.target.value)}
            placeholder={strings.compose.urlPlaceholder}
            className="numeric mt-2 w-full rounded-lg border border-input bg-card px-4 py-3 text-sm outline-none focus-visible:border-ring"
          />
        </div>
      ) : null}

      {preview ? <PostMedia url={preview.url} type={preview.type} /> : null}

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <Button
        size="xl"
        className="mt-8 w-full"
        disabled={publishing || uploading || body.trim().length === 0}
        onClick={onPublish}
      >
        {publishing ? strings.compose.publishing : strings.compose.publish}
      </Button>
    </div>
  );
}
