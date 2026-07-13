import { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { postApi } from "@/api/postApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RichTextEditor } from "@/features/posts/RichTextEditor";
import { useAuth } from "@/hooks/useAuth";

export function PostEditor({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!image) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const submit = async () => {
    if (!title.trim() || !content.trim() || content === "<p></p>") {
      setError("Title and content are required");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await postApi.create({ title: title.trim(), content, image });
      setTitle("");
      setContent("");
      setImage(null);
      setShowPreview(false);
      onCreated();
    } catch {
      setError("Failed to create post");
    } finally {
      setBusy(false);
    }
  };

  const hasPreview = Boolean(title.trim() || (content && content !== "<p></p>") || imagePreviewUrl);

  return (
    <div className="space-y-4">
      <div className="glass-card space-y-3 p-5">
        <p className="label-mono">new post</p>
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Content</Label>
          <RichTextEditor value={content} onChange={setContent} />
        </div>
        <div>
          <Label>Image (optional)</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
          {image && (
            <p className="mt-1 font-mono text-xs text-muted">{image.name}</p>
          )}
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button onClick={submit} disabled={busy}>
            {busy ? "Publishing…" : "Publish"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? "Hide preview" : "Preview"}
          </Button>
        </div>
      </div>

      {showPreview && (
        <div className="glass-card overflow-hidden">
          <div className="border-b border-border-subtle px-5 py-3">
            <p className="label-mono">preview</p>
          </div>
          {!hasPreview ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              Start writing to see how your post will look in the feed.
            </p>
          ) : (
            <>
              {imagePreviewUrl && (
                <img
                  src={imagePreviewUrl}
                  alt=""
                  className="max-h-72 w-full object-cover"
                />
              )}
              <div className="p-5">
                <p className="mb-2 font-mono text-xs text-muted">
                  @{user?.username || "you"} · {new Date().toLocaleDateString()}
                </p>
                <h3 className="text-lg font-semibold text-white">
                  {title.trim() || "Untitled post"}
                </h3>
                {content && content !== "<p></p>" ? (
                  <div
                    className="prose-dark mt-3"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                ) : (
                  <p className="mt-3 text-sm text-muted">Content will appear here…</p>
                )}
                <div className="mt-4 flex items-center gap-3 text-sm text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Heart className="h-4 w-4" />0
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MessageCircle className="h-4 w-4" />0
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
