import { useState } from "react";
import { profileApi, type Education } from "@/api/profileApi";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

const empty = {
  institution: "",
  degree: "",
  field_of_study: "",
  start_year: undefined as number | undefined,
  end_year: undefined as number | undefined,
  grade: "",
  description: "",
  sort_order: 0,
  public_visible: true,
};

export function EducationForm({
  open,
  onClose,
  onSaved,
  items,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  items: Education[];
}) {
  const [form, setForm] = useState({ ...empty });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        ...form,
        start_year: form.start_year || null,
        end_year: form.end_year || null,
      };
      if (editingId) await profileApi.updateEducation(editingId, payload as Omit<Education, "id">);
      else await profileApi.createEducation(payload as Omit<Education, "id">);
      setForm({ ...empty });
      setEditingId(null);
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()} title="Manage education">
      <ul className="mb-4 space-y-2">
        {items.map((e) => (
          <li key={e.id} className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2 text-sm">
            <span>
              {e.degree} — {e.institution}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingId(e.id);
                  setForm({
                    institution: e.institution,
                    degree: e.degree,
                    field_of_study: e.field_of_study,
                    start_year: e.start_year ?? undefined,
                    end_year: e.end_year ?? undefined,
                    grade: e.grade,
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
                  await profileApi.deleteEducation(e.id);
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
        <Field label="Institution" value={form.institution} onChange={(v) => setForm({ ...form, institution: v })} />
        <Field label="Degree" value={form.degree} onChange={(v) => setForm({ ...form, degree: v })} />
        <Field label="Field" value={form.field_of_study} onChange={(v) => setForm({ ...form, field_of_study: v })} />
        <Field label="Grade" value={form.grade} onChange={(v) => setForm({ ...form, grade: v })} />
        <Field
          label="Start year"
          value={form.start_year?.toString() || ""}
          onChange={(v) => setForm({ ...form, start_year: v ? Number(v) : undefined })}
        />
        <Field
          label="End year"
          value={form.end_year?.toString() || ""}
          onChange={(v) => setForm({ ...form, end_year: v ? Number(v) : undefined })}
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button onClick={save} disabled={busy || !form.institution || !form.degree}>
          {editingId ? "Update" : "Add"}
        </Button>
      </div>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
