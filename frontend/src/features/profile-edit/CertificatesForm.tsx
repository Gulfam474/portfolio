import { useState } from "react";
import { profileApi, type Certificate } from "@/api/profileApi";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

const empty = {
  name: "",
  issuer: "",
  year: undefined as number | undefined,
  credential_url: "",
  description: "",
  sort_order: 0,
  public_visible: true,
};

export function CertificatesForm({
  open,
  onClose,
  onSaved,
  items,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  items: Certificate[];
}) {
  const [form, setForm] = useState({ ...empty });
  const [editingId, setEditingId] = useState<number | null>(null);

  const save = async () => {
    const payload = {
      ...form,
      year: form.year || null,
    };
    if (editingId) await profileApi.updateCertificate(editingId, payload as Omit<Certificate, "id">);
    else await profileApi.createCertificate(payload as Omit<Certificate, "id">);
    setForm({ ...empty });
    setEditingId(null);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()} title="Manage certificates">
      <ul className="mb-4 space-y-2">
        {items.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2 text-sm"
          >
            <span>{c.name}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingId(c.id);
                  setForm({
                    name: c.name,
                    issuer: c.issuer,
                    year: c.year ?? undefined,
                    credential_url: c.credential_url,
                    description: c.description,
                    sort_order: c.sort_order,
                    public_visible: c.public_visible,
                  });
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  await profileApi.deleteCertificate(c.id);
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
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>Issuer</Label>
          <Input value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} />
        </div>
        <div>
          <Label>Year</Label>
          <Input
            type="number"
            value={form.year?.toString() || ""}
            onChange={(e) =>
              setForm({ ...form, year: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
        <div>
          <Label>Credential URL</Label>
          <Input
            value={form.credential_url}
            onChange={(e) => setForm({ ...form, credential_url: e.target.value })}
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
