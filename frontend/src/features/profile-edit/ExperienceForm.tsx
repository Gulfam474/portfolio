import { useState } from "react";
import { profileApi, type Experience } from "@/api/profileApi";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RichTextEditor } from "@/features/posts/RichTextEditor";

const empty = {
  company: "",
  role: "",
  location: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
  sort_order: 0,
  public_visible: true,
};

export function ExperienceForm({
  open,
  onClose,
  onSaved,
  items,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  items: Experience[];
}) {
  const [form, setForm] = useState({ ...empty });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      if (editingId) await profileApi.updateExperience(editingId, form);
      else await profileApi.createExperience(form);
      setForm({ ...empty });
      setEditingId(null);
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()} title="Manage experience" className="max-w-2xl">
      <ul className="mb-4 space-y-2">
        {items.map((e) => (
          <li key={e.id} className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2 text-sm">
            <span>
              {e.role} @ {e.company}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingId(e.id);
                  setForm({
                    company: e.company,
                    role: e.role,
                    location: e.location,
                    start_date: e.start_date,
                    end_date: e.end_date,
                    is_current: e.is_current,
                    description: e.description,
                    sort_order: e.sort_order,
                    public_visible: e.public_visible,
                  });
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  await profileApi.deleteExperience(e.id);
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
        <div>
          <Label>Company</Label>
          <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </div>
        <div>
          <Label>Role</Label>
          <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        </div>
        <div>
          <Label>Start</Label>
          <Input value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </div>
        <div>
          <Label>End</Label>
          <Input value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} disabled={form.is_current} />
        </div>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={form.is_current}
          onChange={(e) => setForm({ ...form, is_current: e.target.checked })}
        />
        Current role
      </label>
      <div className="mt-3">
        <Label>Description</Label>
        <RichTextEditor
          value={form.description}
          onChange={(html) => setForm({ ...form, description: html })}
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button onClick={save} disabled={busy || !form.company || !form.role}>
          {editingId ? "Update" : "Add"}
        </Button>
      </div>
    </Dialog>
  );
}
