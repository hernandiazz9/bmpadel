"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/components/auth-provider";
import { PostCard } from "@/components/wall/post-card";
import { useNow } from "@/hooks/use-now";
import { useWall } from "@/hooks/use-wall";
import { strings } from "@/lib/strings";

export default function WallPage() {
  const { user } = useAuth();
  const viewerId = user?.id ?? null;
  const isCoach = user?.role === "coach";
  const now = useNow();
  const { posts, isLoading, isError, like } = useWall(viewerId);

  return (
    <>
      <div className="flex items-start justify-between pt-8 pb-6">
        <h1 className="headline text-4xl">{strings.nav.wall}</h1>
        {isCoach ? (
          // The wall's single `ball`: the one thing only the coach can do.
          <Link
            href="/wall/new"
            aria-label={strings.wall.newPost}
            className="inline-flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground"
          >
            <Plus className="size-6" aria-hidden />
          </Link>
        ) : null}
      </div>

      {isError ? (
        <p className="text-sm text-muted-foreground">{strings.wall.loadFailed}</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">{strings.common.loading}</p>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-4 py-10 text-center">
          <p className="subhead text-lg">{strings.wall.empty}</p>
          {isCoach ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {strings.wall.emptyCoachHint}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((item) => (
            <PostCard
              key={item.post.id}
              item={item}
              now={now}
              canLike={viewerId !== null}
              onToggleLike={() =>
                like.mutate({ postId: item.post.id, liked: item.likedByViewer })
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
