import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Github,
  Linkedin,
  Mail,
  MapPin,
  Pencil,
  ExternalLink,
  Phone,
  Camera,
  Award,
  ArrowDown,
  FileDown,
} from "lucide-react";
import { useState } from "react";
import { profileApi, type ProfileOverview } from "@/api/profileApi";
import { cvApi } from "@/api/cvApi";
import { PermissionGate } from "@/components/layout/PermissionGate";
import { MotionSection } from "@/components/layout/MotionSection";
import { BrandMark } from "@/components/layout/BrandMark";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { BRAND_TAG } from "@/lib/constants";
import { mediaUrl } from "@/lib/utils";
import { PersonalInfoForm } from "@/features/profile-edit/PersonalInfoForm";
import { AvatarCropDialog } from "@/features/profile-edit/AvatarCropDialog";
import { EducationForm } from "@/features/profile-edit/EducationForm";
import { ExperienceForm } from "@/features/profile-edit/ExperienceForm";
import { SkillsForm } from "@/features/profile-edit/SkillsForm";
import { ProjectsForm } from "@/features/profile-edit/ProjectsForm";
import { CertificatesForm } from "@/features/profile-edit/CertificatesForm";
import { CvPreviewCard } from "@/features/cv/CvPreviewCard";

type EditTarget =
  | { type: "personal" }
  | { type: "avatar" }
  | { type: "education" }
  | { type: "experience" }
  | { type: "skills" }
  | { type: "projects" }
  | { type: "certificates" }
  | null;

export function OverviewPage() {
  const { isAuthenticated, ready } = useAuth();
  const qc = useQueryClient();
  const [edit, setEdit] = useState<EditTarget>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["overview", isAuthenticated],
    enabled: ready,
    queryFn: async () => {
      const res = isAuthenticated
        ? await profileApi.overviewFull()
        : await profileApi.overview();
      return res.data;
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["overview"] });

  if (!ready || isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="label-mono">error</p>
        <h1 className="mt-2 text-xl font-semibold text-white">Could not load profile</h1>
        <p className="mt-2 text-sm text-muted">
          {(error as { message?: string })?.message ||
            "Is the API running? Check VITE_API_BASE_URL / Vite proxy."}
        </p>
        <Button className="mt-6" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      <HeroSection
        data={data}
        onEdit={() => setEdit({ type: "personal" })}
        onAvatarEdit={() => setEdit({ type: "avatar" })}
      />
      <div className="mx-auto grid max-w-5xl gap-4 px-3 py-8 sm:px-4 md:gap-8 md:py-10">
        {data.personal_info?.bio && (
          <MotionSection>
            <p className="label-mono">about</p>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted">
              {data.personal_info.bio}
            </p>
          </MotionSection>
        )}
        <EducationSection data={data} onEdit={() => setEdit({ type: "education" })} />
        <ExperienceSection data={data} onEdit={() => setEdit({ type: "experience" })} />
        <SkillsSection data={data} onEdit={() => setEdit({ type: "skills" })} />
        <ProjectsSection data={data} onEdit={() => setEdit({ type: "projects" })} />
        <CertificatesSection data={data} onEdit={() => setEdit({ type: "certificates" })} />
        <MotionSection delay={0.05}>
          <CvPreviewCard embedded />
        </MotionSection>
      </div>

      {!isAuthenticated && (
        <div className="fixed bottom-3 left-1/2 z-20 w-[min(520px,94vw)] -translate-x-1/2">
          <div className="glass-card flex items-center justify-between gap-3 px-3 py-2.5 shadow-[0_0_40px_-12px_rgba(77,184,255,0.35)] sm:px-4 sm:py-3">
            <p className="min-w-0 text-xs text-muted sm:text-sm">
              Login to edit or unlock full details.
            </p>
            <Button
              className="btn-sheen shrink-0"
              size="sm"
              onClick={() => (window.location.href = "/login?returnTo=/")}
            >
              Login
            </Button>
          </div>
        </div>
      )}

      {edit?.type === "personal" && (
        <PersonalInfoForm
          open
          initial={data.personal_info}
          onClose={() => setEdit(null)}
          onSaved={refresh}
        />
      )}
      {edit?.type === "avatar" && (
        <AvatarCropDialog
          open
          currentUrl={
            data.personal_info?.avatar_url
              ? mediaUrl(data.personal_info.avatar_url)
              : "/logo.png"
          }
          onClose={() => setEdit(null)}
          onSaved={refresh}
        />
      )}
      {edit?.type === "education" && (
        <EducationForm
          open
          items={data.education}
          onClose={() => setEdit(null)}
          onSaved={refresh}
        />
      )}
      {edit?.type === "experience" && (
        <ExperienceForm
          open
          items={data.experience}
          onClose={() => setEdit(null)}
          onSaved={refresh}
        />
      )}
      {edit?.type === "skills" && (
        <SkillsForm open items={data.skills} onClose={() => setEdit(null)} onSaved={refresh} />
      )}
      {edit?.type === "projects" && (
        <ProjectsForm
          open
          items={data.projects}
          onClose={() => setEdit(null)}
          onSaved={refresh}
        />
      )}
      {edit?.type === "certificates" && (
        <CertificatesForm
          open
          items={data.certificates || []}
          onClose={() => setEdit(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}

function SectionHeader({
  title,
  onEdit,
}: {
  title: string;
  onEdit?: () => void;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {onEdit && (
        <PermissionGate module="profile" action="edit">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit ${title}`}>
            <Pencil className="h-4 w-4" />
          </Button>
        </PermissionGate>
      )}
    </div>
  );
}

function HeroSection({
  data,
  onEdit,
  onAvatarEdit,
}: {
  data: ProfileOverview;
  onEdit: () => void;
  onAvatarEdit: () => void;
}) {
  const p = data.personal_info;
  const name = p?.full_name || "Gulfam Shaikh";
  const title = p?.title || "Software Developer";
  const tagline =
    p?.tagline || "Python · FastAPI · PostgreSQL · Celery · AI-driven backend systems";

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden border-b border-border-subtle/70"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(77,184,255,0.12),_transparent_55%)]" />
      <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-accent-indigo/20 blur-3xl animate-orb-pulse" />
      <div className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-accent-cyan/15 blur-3xl animate-orb-drift" />

      <div className="relative mx-auto flex min-h-[auto] max-w-5xl flex-col justify-center gap-8 px-4 py-12 md:min-h-[78vh] md:flex-row md:items-center md:justify-between md:gap-10 md:py-20">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-4 flex flex-wrap items-center gap-3 md:mb-5"
          >
            <BrandMark size="lg" />
            <PermissionGate module="profile" action="edit">
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
            </PermissionGate>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.45 }}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted md:text-[11px] md:tracking-[0.24em]"
          >
            {BRAND_TAG}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl md:mt-3 md:text-6xl"
          >
            {name}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.45 }}
            className="mt-2 bg-accent-gradient bg-clip-text font-mono text-base text-transparent sm:text-lg md:mt-3 md:text-xl"
          >
            {title}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.45 }}
            className="mt-3 max-w-xl text-sm leading-relaxed text-muted md:mt-4 md:text-base"
          >
            {tagline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.45 }}
            className="mt-6 flex flex-wrap gap-2.5 md:mt-8 md:gap-3"
          >
            <Button
              className="btn-sheen"
              onClick={() =>
                document.getElementById("work")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore work <ArrowDown className="h-4 w-4 text-[color:var(--on-accent)]" strokeWidth={2.25} />
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                document.getElementById("skills")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Skills
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const a = document.createElement("a");
                a.href = cvApi.downloadUrl();
                a.download = "Gulfam_Shaikh_CV.pdf";
                a.target = "_blank";
                a.rel = "noreferrer";
                a.click();
              }}
            >
              <FileDown className="h-4 w-4" strokeWidth={2.25} />
              Download CV
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted md:mt-8 md:gap-4"
          >
            {p?.location && (
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border-subtle/80 bg-[color:var(--overlay-soft)] px-3 py-1">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-accent-cyan" />
                <span className="truncate">{p.location}</span>
              </span>
            )}
            {p?.email_public && (
              <a
                href={`mailto:${p.email_public}`}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border-subtle/80 bg-[color:var(--overlay-soft)] px-3 py-1 hover:border-accent-cyan/40 hover:text-white"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-accent-cyan" />
                <span className="truncate">{p.email_public}</span>
              </a>
            )}
            {p?.phone && (
              <a
                href={`tel:${p.phone}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle/80 bg-[color:var(--overlay-soft)] px-3 py-1 hover:border-accent-cyan/40 hover:text-white"
              >
                <Phone className="h-3.5 w-3.5 shrink-0 text-accent-cyan" /> {p.phone}
              </a>
            )}
            {p?.github && (
              <a href={p.github} target="_blank" rel="noreferrer" className="hover:text-white">
                <Github className="h-4 w-4" />
              </a>
            )}
            {p?.linkedin && (
              <a href={p.linkedin} target="_blank" rel="noreferrer" className="hover:text-white">
                <Linkedin className="h-4 w-4" />
              </a>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="relative mx-auto order-first shrink-0 md:order-none md:mx-0"
        >
          <div className="absolute -inset-3 animate-spin-slow rounded-full bg-accent-gradient opacity-40 blur-sm" />
          <div className="absolute -inset-[2px] rounded-full bg-accent-gradient opacity-70" />
          <div className="relative h-32 w-32 overflow-hidden rounded-full bg-surface sm:h-40 sm:w-40 md:h-52 md:w-52">
            {p?.avatar_url ? (
              <img
                src={mediaUrl(p.avatar_url)}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src="/logo.png"
                alt="gulfam.sh logo"
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <PermissionGate module="profile" action="edit">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute bottom-2 left-2 z-10 h-9 w-9 rounded-full border border-accent-cyan/40 shadow-lg"
              onClick={onAvatarEdit}
              aria-label="Change profile image"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </PermissionGate>
        </motion.div>
      </div>
    </motion.section>
  );
}

function EducationSection({
  data,
  onEdit,
}: {
  data: ProfileOverview;
  onEdit: () => void;
}) {
  return (
    <MotionSection>
      <SectionHeader title="Education" onEdit={onEdit} />
      {data.education.length === 0 ? (
        <Empty text="No education entries yet." />
      ) : (
        <ul className="space-y-4">
          {data.education.map((e) => (
            <li key={e.id} className="border-l-2 border-accent-indigo/40 pl-4">
              <p className="font-medium text-white">{e.degree}</p>
              <p className="text-sm text-muted">
                {e.institution}
                {e.end_year ? ` · ${e.end_year}` : ""}
                {e.grade ? ` · ${e.grade}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </MotionSection>
  );
}

function ExperienceSection({
  data,
  onEdit,
}: {
  data: ProfileOverview;
  onEdit: () => void;
}) {
  return (
    <MotionSection id="work">
      <SectionHeader title="Experience" onEdit={onEdit} />
      {data.experience.length === 0 ? (
        <Empty text="No experience entries yet." />
      ) : (
        <ul className="space-y-6">
          {data.experience.map((e) => (
            <li key={e.id} className="relative pl-6">
              <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-accent-cyan shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
              <p className="font-medium text-white">
                {e.role}{" "}
                <span className="text-muted">@ {e.company}</span>
              </p>
              <p className="font-mono text-xs text-muted">
                {e.start_date} — {e.is_current ? "Present" : e.end_date}
                {e.location ? ` · ${e.location}` : ""}
              </p>
              {e.description && (
                <div
                  className="prose-dark mt-2"
                  dangerouslySetInnerHTML={{ __html: e.description }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </MotionSection>
  );
}

function SkillsSection({
  data,
  onEdit,
}: {
  data: ProfileOverview;
  onEdit: () => void;
}) {
  const groups = data.skills.reduce<Record<string, typeof data.skills>>((acc, s) => {
    const key = s.group || "General";
    (acc[key] ||= []).push(s);
    return acc;
  }, {});
  const groupEntries = Object.entries(groups);

  const SkillCard = ({
    group,
    skills,
  }: {
    group: string;
    skills: typeof data.skills;
  }) => (
    <div className="skill-group-card w-full p-4">
      <p className="skill-group-label mb-3">{group}</p>
      <div className="space-y-3">
        {skills.map((s) => (
          <div key={s.id}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-foreground">{s.name}</span>
              <span className="shrink-0 font-mono text-xs text-muted">{s.proficiency}%</span>
            </div>
            <div className="skill-track h-1.5 overflow-hidden rounded-full">
              <div
                className="skill-bar-fill h-full rounded-full bg-accent-gradient"
                style={{ width: `${s.proficiency}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <MotionSection id="skills" className="overflow-hidden">
      <SectionHeader title="Skills" onEdit={onEdit} />
      {data.skills.length === 0 ? (
        <Empty text="No skills listed yet." />
      ) : (
        <>
          {/* Mobile: stacked full-width cards */}
          <div className="grid gap-3 md:hidden">
            {groupEntries.map(([group, skills]) => (
              <SkillCard key={group} group={group} skills={skills} />
            ))}
          </div>

          {/* Desktop: sideways browse */}
          <div className="relative hidden md:block">
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[color:var(--glass-bg)] to-transparent" />
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-8 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-accent-cyan/40">
              {groupEntries.map(([group, skills]) => (
                <div
                  key={group}
                  className="min-w-[280px] max-w-[320px] shrink-0 snap-start"
                >
                  <SkillCard group={group} skills={skills} />
                </div>
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted/70">
              Scroll sideways to browse skill groups →
            </p>
          </div>
        </>
      )}
    </MotionSection>
  );
}

function ProjectsSection({
  data,
  onEdit,
}: {
  data: ProfileOverview;
  onEdit: () => void;
}) {
  return (
    <MotionSection>
      <SectionHeader title="Projects" onEdit={onEdit} />
      {data.projects.length === 0 ? (
        <Empty text="No projects yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.projects.map((p) => (
            <article
              key={p.id}
              className="group overflow-hidden rounded-xl border border-border-subtle bg-[color:var(--overlay-soft)] transition duration-300 hover:-translate-y-1 hover:border-accent-cyan/35 hover:shadow-[0_0_30px_-12px_rgba(77,184,255,0.35)]"
            >
              {p.thumbnail_url && (
                <img
                  src={mediaUrl(p.thumbnail_url)}
                  alt=""
                  className="h-36 w-full object-cover transition duration-500 group-hover:scale-[1.03] sm:h-40"
                />
              )}
              <div className="p-4">
                <h3 className="text-base font-medium leading-snug text-foreground sm:text-[1.05rem]">
                  {p.title}
                </h3>
                <div
                  className="prose-dark mt-2 line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: p.description }}
                />
                {p.tech_stack && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tech_stack.split(",").map((t) => (
                      <span
                        key={t}
                        className="tech-chip rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide"
                      >
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {p.project_url && (
                    <a
                      href={p.project_url}
                      className="inline-flex items-center gap-1 text-accent-cyan hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Live <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {p.repo_url && (
                    <a
                      href={p.repo_url}
                      className="inline-flex items-center gap-1 text-muted hover:text-foreground"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Repo
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </MotionSection>
  );
}

function CertificatesSection({
  data,
  onEdit,
}: {
  data: ProfileOverview;
  onEdit: () => void;
}) {
  const items = data.certificates || [];
  return (
    <MotionSection>
      <SectionHeader title="Certificates" onEdit={onEdit} />
      {items.length === 0 ? (
        <Empty text="No certificates listed yet." />
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((c) => (
            <li
              key={c.id}
              className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border-subtle bg-[color:var(--overlay-soft)] px-3 py-2 text-sm text-foreground transition hover:border-accent-cyan/40"
            >
              <Award className="h-3.5 w-3.5 shrink-0 text-accent-cyan" />
              <span className="min-w-0 truncate">{c.name}</span>
              {c.issuer && (
                <span className="hidden truncate text-xs text-muted sm:inline">· {c.issuer}</span>
              )}
              {c.year && <span className="shrink-0 font-mono text-xs text-muted">{c.year}</span>}
            </li>
          ))}
        </ul>
      )}
    </MotionSection>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted">{text}</p>;
}
