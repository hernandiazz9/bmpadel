"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";

import type { WallPost } from "@/hooks/use-wall";
import { LikeButton } from "@/components/wall/like-button";
import { PostMedia } from "@/components/wall/post-media";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { strings } from "@/lib/strings";
import { formatTimeAgo } from "@/lib/time";

export function AuthorLine({
  name,
  avatarUrl,
  createdAt,
  now,
}: {
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  now: Date;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-9">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="subhead min-w-0 flex-1 truncate text-sm">{name}</span>
      <span className="numeric text-[11px] text-muted-foreground">
        {formatTimeAgo(createdAt, now)}
      </span>
    </div>
  );
}

/**
 * One post in the feed.
 *
 * The body and media link through to the detail screen; the actions row does
 * not, so tapping Like never navigates by accident.
 */
export function PostCard({
  item,
  now,
  canLike,
  onToggleLike,
}: {
  item: WallPost;
  now: Date;
  canLike: boolean;
  onToggleLike: () => void;
}) {
  const { post, author } = item;

  return (
    <article className="rounded-lg bg-card p-4">
      <AuthorLine
        name={author?.name ?? ""}
        avatarUrl={author?.avatar_url ?? null}
        createdAt={post.created_at}
        now={now}
      />

      <Link href={`/wall/${post.id}`} className="block">
        <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap">
          {post.body}
        </p>
        {post.media_url ? (
          <PostMedia url={post.media_url} type={post.media_type} />
        ) : null}
      </Link>

      <div className="mt-4 flex items-center gap-6 border-t border-border pt-3">
        <LikeButton
          liked={item.likedByViewer}
          count={item.likeCount}
          disabled={!canLike}
          onToggle={onToggleLike}
        />
        <Link
          href={`/wall/${post.id}`}
          className="-m-2 inline-flex items-center gap-2 p-2 text-muted-foreground"
          aria-label={strings.wall.commentCount(item.commentCount)}
        >
          <MessageCircle className="size-5" strokeWidth={1.75} aria-hidden />
          <span className="numeric text-xs">{item.commentCount}</span>
        </Link>
      </div>
    </article>
  );
}
