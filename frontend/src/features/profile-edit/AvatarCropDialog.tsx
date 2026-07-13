import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ZoomIn, ZoomOut } from "lucide-react";
import { profileApi } from "@/api/profileApi";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

const VIEW = 280;
const OUTPUT = 512;
const GRID = 4;

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  currentUrl?: string | null;
};

export function AvatarCropDialog({ open, onClose, onSaved, currentUrl }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) return;
    setSrc((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setError("");
    setBusy(false);
  }, [open]);

  const fitImage = useCallback((w: number, h: number) => {
    const cover = Math.max(VIEW / w, VIEW / h);
    setScale(cover);
    setOffset({ x: (VIEW - w * cover) / 2, y: (VIEW - h * cover) / 2 });
  }, []);

  const onFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    setError("");
    if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      fitImage(img.naturalWidth, img.naturalHeight);
      setSrc(url);
    };
    img.onerror = () => setError("Could not load image");
    img.src = url;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!src) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  };

  const onPointerUp = () => setDragging(false);

  const changeScale = (next: number) => {
    const clamped = Math.min(4, Math.max(0.2, next));
    const cx = VIEW / 2;
    const cy = VIEW / 2;
    const ratio = clamped / scale;
    setOffset({
      x: cx - (cx - offset.x) * ratio,
      y: cy - (cy - offset.y) * ratio,
    });
    setScale(clamped);
  };

  const exportBlob = (): Promise<Blob> =>
    new Promise((resolve, reject) => {
      if (!src || !natural.w) {
        reject(new Error("No image"));
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = "#101018";
        ctx.fillRect(0, 0, OUTPUT, OUTPUT);
        ctx.beginPath();
        ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const factor = OUTPUT / VIEW;
        ctx.drawImage(
          img,
          offset.x * factor,
          offset.y * factor,
          natural.w * scale * factor,
          natural.h * scale * factor,
        );
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
          "image/jpeg",
          0.92,
        );
      };
      img.onerror = () => reject(new Error("Could not encode image"));
      img.src = src;
    });

  const save = async () => {
    if (!src) {
      setError("Choose an image first");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const blob = await exportBlob();
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      await profileApi.uploadAvatar(file);
      onSaved();
      onClose();
    } catch {
      setError("Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Profile image"
      className="w-[min(420px,92vw)]"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Upload a photo, then drag and zoom on the grid to fit it in the circle.
        </p>

        <div className="flex justify-center">
          <div
            className="relative touch-none select-none overflow-hidden rounded-full border border-accent-cyan/40 bg-background shadow-[0_0_40px_-12px_rgba(34,211,238,0.5)]"
            style={{ width: VIEW, height: VIEW, cursor: src ? (dragging ? "grabbing" : "grab") : "default" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {src ? (
              <img
                src={src}
                alt=""
                draggable={false}
                className="pointer-events-none absolute max-w-none"
                style={{
                  width: natural.w * scale,
                  height: natural.h * scale,
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                }}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted">
                {currentUrl ? (
                  <img src={currentUrl} alt="" className="h-full w-full object-cover opacity-40" />
                ) : null}
                <Camera className="absolute h-8 w-8 text-accent-cyan" />
              </div>
            )}

            {/* Fit grid overlay */}
            <div className="pointer-events-none absolute inset-0">
              {Array.from({ length: GRID - 1 }).map((_, i) => {
                const pos = ((i + 1) / GRID) * 100;
                return (
                  <span key={`v-${i}`}>
                    <span
                      className="absolute top-0 h-full w-px bg-white/25"
                      style={{ left: `${pos}%` }}
                    />
                    <span
                      className="absolute left-0 h-px w-full bg-white/25"
                      style={{ top: `${pos}%` }}
                    />
                  </span>
                );
              })}
              <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/30" />
              <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-accent-cyan/40" />
              <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-accent-cyan/40" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Zoom</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={!src}
              onClick={() => changeScale(scale / 1.1)}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <input
              type="range"
              min={0.2}
              max={4}
              step={0.01}
              value={scale}
              disabled={!src}
              onChange={(e) => changeScale(Number(e.target.value))}
              className="h-2 w-full accent-cyan-400"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={!src}
              onClick={() => changeScale(scale * 1.1)}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
            Choose image
          </Button>
          <Button type="button" disabled={busy || !src} onClick={save}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
