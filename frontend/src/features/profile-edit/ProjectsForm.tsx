import { useState } from "react";
import { profileApi, type Project } from "@/api/profileApi";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RichTextEditor } from "@/features/posts/RichTextEditor";

const empty = {
  title: "",
  description: "",
  tech_stack: "",
  project_url: "",
  repo_url: "",
  thumbnail_url: "" as string | null,
  sort_order: 0,
  public_visible: true,
};

export function ProjectsForm({
  open,
  onClose,
  onSaved,
  items,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  items: Project[];
}) {
  const [form, setForm] = useState({ ...empty });
  const [editingId, setEditingId] = useState<number | null>(null);

  const save = async () => {
    const payload = { ...form, thumbnail_url: form.thumbnail_url || null };
    if (editingId) await profileApi.updateProject(editingId, payload);
    else await profileApi.createProject(payload);
    setForm({ ...empty });
    setEditingId(null);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()} title="Manage projects" className="max-w-2xl">
      <ul className="mb-4 space-y-2">
        {items.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2 text-sm">
            <span>{p.title}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingId(p.id);
                  setForm({
                    title: p.title,
                    description: p.description,
                    tech_stack: p.tech_stack,
                    project_url: p.project_url,
                    repo_url: p.repo_url,
                    thumbnail_url: p.thumbnail_url || "",
                    sort_order: p.sort_order,
                    public_visible: p.public_visible,
                  });
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  await profileApi.deleteProject(p.id);
                  onSaved();
                }}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Title</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <Label>Tech stack (comma-separated)</Label>
          <Input value={form.tech_stack} onChange={(e) => setForm({ ...form, tech_stack: e.target.value })} />
        </div>
        <div>
          <Label>Thumbnail URL</Label>
          <Input value={form.thumbnail_url || ""} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />
        </div>
        <div>
          <Label>Live URL</Label>
          <Input value={form.project_url} onChange={(e) => setForm({ ...form, project_url: e.target.value })} />
        </div>
        <div>
          <Label>Repo URL</Label>
          <Input value={form.repo_url} onChange={(e) => setForm({ ...form, repo_url: e.target.value })} />
        </div>
      </div>
      <div className="mt-3">
        <Label>Description</Label>
        <RichTextEditor value={form.description} onChange={(html) => setForm({ ...form, description: html })} />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button onClick={save} disabled={!form.title}>
          {editingId ? "Update" : "Add"}
        </Button>
      </div>
    </Dialog>
  );
}
