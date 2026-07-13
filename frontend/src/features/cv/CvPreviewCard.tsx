import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, ExternalLink, FileUp, Maximize2, X } from "lucide-react";
import { cvApi } from "@/api/cvApi";
import { Button } from "@/components/ui/Button";
import { PermissionGate } from "@/components/layout/PermissionGate";
import { useAuth } from "@/hooks/useAuth";
import { mediaUrl } from "@/lib/utils";

export function CvPreviewCard({ embedded = false }: { embedded?: boolean }) {
  const { accessToken, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  const { data, isError } = useQuery({
    queryKey: ["cv-preview"],
    queryFn: async () => (await cvApi.preview()).data,
    retry: false,
  });

  const previewSrc = data?.url ? mediaUrl(data.url) : null;

  const upload = async (file: File) => {
    setUploading(true);
    setErr("");
    try {
      await cvApi.upload(file);
      await qc.invalidateQueries({ queryKey: ["cv-preview"] });
      await qc.invalidateQueries({ queryKey: ["overview"] });
    } catch {
      setErr("Upload failed. PDF only, max 10MB.");
    } finally {
      setUploading(false);
    }
  };

  const downloadWithAuth = async (url: string, filename: string) => {
    const res = await fetch(url, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      credentials: "include",
    });
    if (!res.ok) throw new Error("download failed");
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(href);
  };

  const openInNewTab = () => {
    if (!previewSrc) return;
    window.open(previewSrc, "_blank", "noopener,noreferrer");
  };

  const body = (
    <>
      <h2 className="text-xl font-semibold text-white">CV</h2>
      <p className="mt-1 text-sm text-muted">Preview and download the latest résumé.</p>

      <div className="relative mt-4 overflow-hidden rounded-lg border border-border-subtle bg-background">
        {previewSrc && !isError ? (
          <iframe title="CV preview" src={previewSrc} className="h-[420px] w-full" />
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-muted">
            No CV uploaded yet.
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!previewSrc}
          onClick={() => setFullscreen(true)}
        >
          <Maximize2 className="h-4 w-4" strokeWidth={2.25} /> Full screen
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!previewSrc}
          onClick={openInNewTab}
        >
          <ExternalLink className="h-4 w-4" strokeWidth={2.25} /> Open in new tab
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!previewSrc}
          onClick={() => downloadWithAuth(cvApi.downloadUrl(), "cv.pdf")}
        >
          <Download className="h-4 w-4" strokeWidth={2.25} /> PDF
        </Button>
        {isAuthenticated && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              downloadWithAuth(cvApi.latexUrl(), "cv_latex.pdf").catch(() =>
                setErr("LaTeX export failed — is tectonic/pdflatex installed?")
              )
            }
          >
            <Download className="h-4 w-4" strokeWidth={2.25} /> LaTeX PDF
          </Button>
        )}
        <PermissionGate module="cv" action="edit">
          <Button
            size="sm"
            className="btn-sheen"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <FileUp className="h-4 w-4" strokeWidth={2.25} />{" "}
            {uploading ? "Uploading…" : "Upload PDF"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
        </PermissionGate>
      </div>
      {err && <p className="mt-2 text-sm text-red-400">{err}</p>}

      {fullscreen && previewSrc && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background/95 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <p className="font-mono text-sm text-white">CV preview</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={openInNewTab}>
                <ExternalLink className="h-4 w-4" /> New tab
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setFullscreen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <iframe title="CV fullscreen" src={previewSrc} className="h-full w-full flex-1" />
        </div>
      )}
    </>
  );

  if (embedded) return <div>{body}</div>;
  return <section className="glass-card glass-card-hover p-6">{body}</section>;
}
