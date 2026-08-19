/**
 * Writes to the wall: posts, likes and comments.
 *
 * Deleting is allowed, editing is not — a decision taken with the rest of the
 * reversible ones, and the reason posts carry no `updated_at`.
 */

import { supabase } from "@/lib/supabase";
import type { Comment, MediaType, Post } from "@/lib/types";

/** Like is a toggle, and the pair (post_id, user_id) is its whole identity. */
export async function toggleLike(
  postId: string,
  userId: string,
  liked: boolean,
): Promise<void> {
  if (liked) {
    const { error } = await supabase
      .from("like")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("like")
    .insert({ post_id: postId, user_id: userId });
  // A duplicate means two taps raced; the row is already there, which is the
  // state the user asked for.
  if (error && error.code !== "23505") throw error;
}

export async function addComment(
  postId: string,
  userId: string,
  body: string,
): Promise<Comment> {
  const { data, error } = await supabase
    .from("comment")
    .insert({ post_id: postId, user_id: userId, body: body.trim() })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** Only ever called for the viewer's own comment; the UI hides it otherwise. */
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from("comment").delete().eq("id", commentId);
  if (error) throw error;
}

export async function createPost(
  authorId: string,
  body: string,
  mediaUrl: string | null,
  mediaType: MediaType | null,
): Promise<Post> {
  const { data, error } = await supabase
    .from("post")
    .insert({
      author_id: authorId,
      body: body.trim(),
      media_url: mediaUrl,
      media_type: mediaType,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** Likes and comments go with it — the schema cascades. */
export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from("post").delete().eq("id", postId);
  if (error) throw error;
}

/**
 * Guesses the media kind from a URL, for the escape-hatch field where someone
 * pastes a link instead of uploading. Falls back to image, which degrades more
 * gracefully than a video element that will not play.
 */
export function mediaTypeFromUrl(url: string): MediaType {
  const path = url.split("?")[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v|ogv)$/.test(path) ? "video" : "image";
}
