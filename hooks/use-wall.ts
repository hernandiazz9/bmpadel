"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "@/lib/supabase";
import type { AppUser, Comment, Like, Post } from "@/lib/types";
import { toggleLike } from "@/lib/wall";

export type WallPost = {
  post: Post;
  author: AppUser | null;
  likeCount: number;
  likedByViewer: boolean;
  commentCount: number;
};

/** How far back the feed goes. Far more than a demo needs. */
const FEED_LIMIT = 50;

type WallData = {
  posts: Post[];
  authors: Map<string, AppUser>;
  likes: Like[];
  comments: Comment[];
};

/**
 * The whole wall in four reads.
 *
 * Posts, their authors, every like and every comment on them. At demo volume
 * that is a few dozen rows, and holding them together means the feed and a post
 * detail screen share one cache entry — open a post and it is already there,
 * with no second spinner.
 */
async function fetchWall(): Promise<WallData> {
  const { data: posts, error } = await supabase
    .from("post")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT);
  if (error) throw error;

  if (posts.length === 0) {
    return { posts, authors: new Map(), likes: [], comments: [] };
  }

  const postIds = posts.map((post) => post.id);

  const [likesResult, commentsResult] = await Promise.all([
    supabase.from("like").select("*").in("post_id", postIds),
    supabase
      .from("comment")
      .select("*")
      .in("post_id", postIds)
      .order("created_at", { ascending: true }),
  ]);
  if (likesResult.error) throw likesResult.error;
  if (commentsResult.error) throw commentsResult.error;

  // Everyone who wrote a post or a comment — one lookup covers both lists.
  const peopleIds = Array.from(
    new Set([
      ...posts.map((post) => post.author_id),
      ...commentsResult.data.map((comment) => comment.user_id),
    ]),
  );
  const { data: people, error: peopleError } = await supabase
    .from("user")
    .select("*")
    .in("id", peopleIds);
  if (peopleError) throw peopleError;

  return {
    posts,
    authors: new Map(people.map((person) => [person.id, person])),
    likes: likesResult.data,
    comments: commentsResult.data,
  };
}

function shape(data: WallData, viewerId: string | null): WallPost[] {
  const likesByPost = new Map<string, Like[]>();
  for (const like of data.likes) {
    const bucket = likesByPost.get(like.post_id);
    if (bucket) bucket.push(like);
    else likesByPost.set(like.post_id, [like]);
  }

  const commentCounts = new Map<string, number>();
  for (const comment of data.comments) {
    commentCounts.set(
      comment.post_id,
      (commentCounts.get(comment.post_id) ?? 0) + 1,
    );
  }

  return data.posts.map((post) => {
    const likes = likesByPost.get(post.id) ?? [];
    return {
      post,
      author: data.authors.get(post.author_id) ?? null,
      likeCount: likes.length,
      likedByViewer:
        viewerId !== null && likes.some((like) => like.user_id === viewerId),
      commentCount: commentCounts.get(post.id) ?? 0,
    };
  });
}

const WALL_KEY = ["wall"] as const;

/**
 * The wall, live.
 *
 * One of the two Realtime screens (the class roster is the other). Posts, likes
 * and comments all invalidate the same cache entry, so a like landing from the
 * other phone refreshes the feed and any open post together.
 */
export function useWall(viewerId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: WALL_KEY,
    queryFn: fetchWall,
  });

  useEffect(() => {
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: WALL_KEY });
    };

    const channel = supabase
      .channel("wall")
      .on("postgres_changes", { event: "*", schema: "public", table: "post" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "like" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "comment" }, invalidate)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  /**
   * Optimistic, because a like that waits for the network reads as a broken
   * button. The snapshot is restored if the write fails.
   */
  const like = useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (!viewerId) throw new Error("Not signed in");
      return toggleLike(postId, viewerId, liked);
    },
    onMutate: async ({ postId, liked }) => {
      if (!viewerId) return { previous: undefined };
      await queryClient.cancelQueries({ queryKey: WALL_KEY });
      const previous = queryClient.getQueryData<WallData>(WALL_KEY);
      if (previous) {
        queryClient.setQueryData<WallData>(WALL_KEY, {
          ...previous,
          likes: liked
            ? previous.likes.filter(
                (item) => !(item.post_id === postId && item.user_id === viewerId),
              )
            : [...previous.likes, { post_id: postId, user_id: viewerId }],
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(WALL_KEY, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: WALL_KEY });
    },
  });

  const data = query.data;

  return {
    posts: data ? shape(data, viewerId) : [],
    comments: data?.comments ?? [],
    authors: data?.authors ?? new Map<string, AppUser>(),
    isLoading: query.isPending,
    isError: query.isError,
    like,
    refresh: () => queryClient.invalidateQueries({ queryKey: WALL_KEY }),
  };
}
