import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileApi, type PersonalInfo } from "@/api/profileApi";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";

const schema = z.object({
  full_name: z.string(),
  title: z.string(),
  tagline: z.string(),
  bio: z.string(),
  location: z.string(),
  email_public: z.string(),
  phone: z.string(),
  website: z.string(),
  github: z.string(),
  linkedin: z.string(),
  twitter: z.string(),
  avatar_url: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export function PersonalInfoForm({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial: PersonalInfo | null;
}) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: initial?.full_name || "",
      title: initial?.title || "",
      tagline: initial?.tagline || "",
      bio: initial?.bio || "",
      location: initial?.location || "",
      email_public: initial?.email_public || "",
      phone: initial?.phone || "",
      website: initial?.website || "",
      github: initial?.github || "",
      linkedin: initial?.linkedin || "",
      twitter: initial?.twitter || "",
      avatar_url: initial?.avatar_url || "",
    },
  });

  const onSubmit = async (values: Form) => {
    await profileApi.updatePersonal({
      ...values,
      avatar_url: initial?.avatar_url ?? null,
    });
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()} title="Edit personal info">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["full_name", "Full name"],
            ["title", "Title"],
            ["tagline", "Tagline"],
            ["location", "Location"],
            ["email_public", "Public email"],
            ["phone", "Phone"],
            ["website", "Website"],
            ["github", "GitHub"],
            ["linkedin", "LinkedIn"],
            ["twitter", "Twitter"],
          ] as const
        ).map(([name, label]) => (
          <div key={name} className={name === "tagline" ? "sm:col-span-2" : ""}>
            <Label>{label}</Label>
            <Input {...register(name)} />
          </div>
        ))}
        <div className="sm:col-span-2">
          <Label>Bio</Label>
          <Textarea {...register("bio")} rows={4} />
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
