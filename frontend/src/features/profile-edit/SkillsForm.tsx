import { useState } from "react";
import { profileApi, type Skill } from "@/api/profileApi";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

const empty = {
  name: "",
  group: "General",
  proficiency: 80,
  sort_order: 0,
  public_visible: true,
};

export function SkillsForm({
  open,
  onClose,
  onSaved,
  items,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  items: Skill[];
}) {
  const [form, setForm] = useState({ ...empty });
  const [editingId, setEditingId] = useState<number | null>(null);

  const save = async () => {
    if (editingId) await profileApi.updateSkill(editingId, form);
    else await profileApi.createSkill(form);
    setForm({ ...empty });
    setEditingId(null);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()} title="Manage skills">
      <ul className="mb-4 space-y-2">
        {items.map((s) => (
          <li key={s.id} className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2 text-sm">
            <span>
              {s.name} ({s.proficiency}%)
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingId(s.id);
                  setForm({
                    name: s.name,
                    group: s.group,
                    proficiency: s.proficiency,
                    sort_order: s.sort_order,
                    public_visible: s.public_visible,
                  });
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  await profileApi.deleteSkill(s.id);
                  onSaved();
                }}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>Group</Label>
          <Input value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} />
        </div>
        <div>
          <Label>Proficiency</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={form.proficiency}
            onChange={(e) => setForm({ ...form, proficiency: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button onClick={save} disabled={!form.name}>
          {editingId ? "Update" : "Add"}
        </Button>
      </div>
    </Dialog>
  );
}
