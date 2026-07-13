import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Comment, Post } from "@/api/postApi";
import { postApi } from "@/api/postApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { cn, mediaUrl } from "@/lib/utils";
import { useUiStore } from "@/store/useUiStore";

const COLLAPSED_MAX_HEIGHT = 160;

export function PostCard({
  post,
  onChanged,
}: {
  post: Post;
  onChanged: () => void;
}) {
  const { isAuthenticated, user } = useAuth();
  const canDelete = usePermission("posts", "delete");
  const viewMode = useUiStore((s) => s.viewMode);
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [needsClamp, setNeedsClamp] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setExpanded(false);
    const el = contentRef.current;
    if (!el) return;
    const measure = () => {
      setNeedsClamp(el.scrollHeight > COLLAPSED_MAX_HEIGHT + 8);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [post.id, post.content]);

  const toggleLike = async () => {
    if (!isAuthenticated) {
      window.location.href = `/login?returnTo=/posts`;
      return;
    }
    if (post.liked_by_me) await postApi.unlike(post.id);
    else await postApi.like(post.id);
    onChanged();
  };

  const loadComments = async () => {
    const { data } = await postApi.comments(post.id);
    setComments(data);
    setShowComments(true);
  };

  const submitComment = async () => {
    if (!comment.trim()) return;
    await postApi.addComment(post.id, comment.trim());
    setComment("");
    await loadComments();
    onChanged();
  };

  const remove = async () => {
    await postApi.remove(post.id);
    onChanged();
  };

  const showDelete =
    viewMode === "editor" && (canDelete || user?.id === post.author.id);
  const clamped = needsClamp && !expanded;

  return (
    <article className="glass-card overflow-hidden">
      {post.image_url && (
        <img
          src={mediaUrl(post.image_url)}
          alt=""
          className={cn("w-full object-cover", clamped ? "max-h-40" : "max-h-72")}
        />
      )}
      <div className="p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-mono text-xs text-muted">
            @{post.author.username} · {new Date(post.created_at).toLocaleDateString()}
          </p>
          {showDelete && (
            <Button size="icon" variant="ghost" onClick={remove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <h3 className="text-lg font-semibold text-white">{post.title}</h3>
        <div className="relative mt-3">
          <div
            ref={contentRef}
            className="prose-dark overflow-hidden transition-[max-height]"
            style={{ maxHeight: clamped ? COLLAPSED_MAX_HEIGHT : undefined }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          {clamped && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface to-transparent"
              aria-hidden
            />
          )}
        </div>
        {needsClamp && (
          <Button
            size="sm"
            variant="ghost"
            className="mt-2 px-0 text-accent-cyan hover:bg-transparent"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Show less" : "Load more"}
          </Button>
        )}
        <div className="mt-4 flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={toggleLike}>
            <Heart
              className={`h-4 w-4 ${post.liked_by_me ? "fill-accent-cyan text-accent-cyan" : ""}`}
            />
            {post.like_count}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => (showComments ? setShowComments(false) : loadComments())}
          >
            <MessageCircle className="h-4 w-4" />
            {post.comment_count}
          </Button>
        </div>
        {showComments && (
          <div className="mt-4 space-y-3 border-t border-border-subtle pt-4">
            {comments.map((c) => (
              <div key={c.id} className="text-sm">
                <span className="font-mono text-xs text-accent-cyan">@{c.user.username}</span>
                <p className="text-muted" dangerouslySetInnerHTML={{ __html: c.content }} />
              </div>
            ))}
            {isAuthenticated && (
              <div className="flex gap-2">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment…"
                />
                <Button size="sm" onClick={submitComment}>
                  Send
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
