"use client";

import type { MediaType } from "@/lib/types";

/**
 * Media in the feed, always in a 4:5 frame.
 *
 * A landscape photo and a vertical phone video are wildly different shapes, and
 * letting each keep its own would make the feed lurch as you scroll. Cropping
 * both to one portrait-leaning frame keeps the rhythm; 4:5 is tall enough that
 * a vertical video still reads as vertical without eating the whole screen.
 */
export function PostMedia({
  url,
  type,
}: {
  url: string;
  type: MediaType | null;
}) {
  return (
    <div className="relative mt-3 aspect-4/5 w-full overflow-hidden rounded-lg bg-secondary">
      {type === "video" ? (
        <video
          src={url}
          className="absolute inset-0 size-full object-cover"
          controls
          playsInline
          preload="metadata"
        />
      ) : (
        // Not next/image: media_url can point anywhere, including the paste-a-
        // link escape hatch, and configuring remote patterns for "any host the
        // coach types" is not something next/image can do.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
        />
      )}
    </div>
  );
}
