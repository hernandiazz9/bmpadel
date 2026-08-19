"use client";

import { ChevronLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { AuthorLine } from "@/components/wall/post-card";
import { LikeButton } from "@/components/wall/like-button";
import { PostMedia } from "@/components/wall/post-media";
import { useNow } from "@/hooks/use-now";
import { useWall } from "@/hooks/use-wall";
import { strings } from "@/lib/strings";
import { formatTimeAgo } from "@/lib/time";
import { addComment, deleteComment, deletePost } from "@/lib/wall";

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const viewerId = user?.id ?? null;
  const now = useNow();
  const { posts, comments, authors, isLoading, isError, like, refresh } =
    useWall(viewerId);

  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const item = posts.find((entry) => entry.post.id === params.id) ?? null;
  const thread = comments.filter((comment) => comment.post_id === params.id);

  if (isLoading) {
    return (
      <div className="pt-10">
        <BackLink />
        <p className="mt-8 text-sm text-muted-foreground">{strings.common.loading}</p>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="pt-10">
        <BackLink />
        <p className="mt-8 text-sm text-muted-foreground">
          {isError ? strings.wall.loadFailed : strings.wall.postNotFound}
        </p>
      </div>
    );
  }

  const { post, author } = item;
  const isAuthor = viewerId !== null && post.author_id === viewerId;

  async function onSend() {
    const body = draft.trim();
    if (!body || !viewerId) return;
    setBusy(true);
    setDraft("");
    try {
      await addComment(post.id, viewerId, body);
      await refresh();
    } catch {
      setDraft(body); // Hand the text back rather than losing it.
    } finally {
      setBusy(false);
    }
  }

  async function onDeletePost() {
    if (!window.confirm(strings.wall.confirmDeletePost)) return;
    await deletePost(post.id);
    router.replace("/wall");
  }

  return (
    <div className="pt-10 pb-4">
      <div className="flex items-center justify-between">
        <BackLink />
        {isAuthor ? (
          <button
            type="button"
            onClick={onDeletePost}
            aria-label={strings.wall.deletePost}
            className="-m-2 p-2 text-muted-foreground"
          >
            <Trash2 className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>

      <article className="mt-6 rounded-lg bg-card p-4">
        <AuthorLine
          name={author?.name ?? ""}
          avatarUrl={author?.avatar_url ?? null}
          createdAt={post.created_at}
          now={now}
        />
        <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap">
          {post.body}
        </p>
        {post.media_url ? (
          <PostMedia url={post.media_url} type={post.media_type} />
        ) : null}
        <div className="mt-4 border-t border-border pt-3">
          <LikeButton
            liked={item.likedByViewer}
            count={item.likeCount}
            disabled={viewerId === null}
            onToggle={() => like.mutate({ postId: post.id, liked: item.likedByViewer })}
          />
        </div>
      </article>

      <section className="mt-8">
        <h2 className="subhead border-b border-border pb-2 text-lg">
          {strings.wall.comments}
        </h2>

        {thread.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {strings.wall.noComments}
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-5">
            {thread.map((comment) => {
              const person = authors.get(comment.user_id) ?? null;
              const mine = viewerId !== null && comment.user_id === viewerId;
              return (
                <li key={comment.id}>
                  <div className="flex items-baseline gap-2">
                    <span className="subhead text-sm">{person?.name ?? ""}</span>
                    <span className="numeric text-[11px] text-muted-foreground">
                      {formatTimeAgo(comment.created_at, now)}
                    </span>
                    {mine ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteComment(comment.id);
                          await refresh();
                        }}
                        className="ml-auto text-[11px] text-muted-foreground underline underline-offset-2"
                      >
                        {strings.wall.deleteComment}
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{comment.body}</p>
                </li>
              );
            })}
          </ul>
        )}

        {viewerId ? (
          <div className="mt-6 flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={strings.wall.commentPlaceholder}
              rows={2}
              className="min-h-12 flex-1 resize-none rounded-lg border border-input bg-card px-4 py-3 text-sm outline-none focus-visible:border-ring"
            />
            <Button
              size="lg"
              disabled={busy || draft.trim().length === 0}
              onClick={onSend}
            >
              {busy ? strings.wall.sending : strings.wall.send}
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/wall"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground"
    >
      <ChevronLeft className="size-4" aria-hidden />
      {strings.nav.wall}
    </Link>
  );
}
