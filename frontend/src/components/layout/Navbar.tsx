import { NavLink, useNavigate } from "react-router-dom";
import { Eye, Home, Moon, Pencil, Rss, ShieldCheck, Sun } from "lucide-react";
import { BrandMark } from "@/components/layout/BrandMark";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/useUiStore";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "relative font-mono text-xs uppercase tracking-[0.16em] transition",
    isActive ? "text-accent-cyan" : "text-muted hover:text-white",
  );

const bottomLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex flex-1 flex-col items-center justify-center gap-1 py-2 font-mono text-[10px] uppercase tracking-wide transition",
    isActive ? "text-accent-cyan" : "text-muted hover:text-white",
  );

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const canAdmin = usePermission("admin", "view");
  const canEditProfile = usePermission("profile", "edit");
  const canEditPosts = usePermission("posts", "edit");
  const canEditCv = usePermission("cv", "edit");
  const canEditSite = canEditProfile || canEditPosts || canEditCv;
  const isOwner = user?.role?.name === "owner" || canEditSite;
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const viewMode = useUiStore((s) => s.viewMode);
  const toggleViewMode = useUiStore((s) => s.toggleViewMode);
  const navigate = useNavigate();

  return (
    <>
    <header className="sticky top-0 z-30 border-b border-border-subtle/60 bg-background/55 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/35 to-transparent" />
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <BrandMark />

        <nav className="hidden items-center gap-7 md:flex">
          <NavLink to="/" end className={linkClass}>
            Overview
          </NavLink>
          <NavLink to="/posts" className={linkClass}>
            Posts
          </NavLink>
          {canAdmin && viewMode === "editor" && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {isAuthenticated && isOwner && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={toggleViewMode}
              title={
                viewMode === "editor"
                  ? "Switch to read-only preview"
                  : "Switch to editor view"
              }
            >
              {viewMode === "editor" ? (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </>
              ) : (
                <>
                  <Pencil className="h-3.5 w-3.5" />
                  Editor
                </>
              )}
            </Button>
          )}

          {isAuthenticated ? (
            <>
              <span className="rounded-md border border-border-subtle/80 px-2 py-1 font-mono text-[11px] text-muted"
                style={{ background: "var(--overlay-soft)" }}
              >
                @{user?.username}
                {viewMode === "preview" && isOwner ? " · preview" : ""}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button size="sm" className="btn-sheen" onClick={() => navigate("/register")}>
                Register
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          {isAuthenticated && isOwner && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleViewMode}
              aria-label={
                viewMode === "editor" ? "Switch to read-only preview" : "Switch to editor view"
              }
              title={
                viewMode === "editor" ? "Switch to read-only preview" : "Switch to editor view"
              }
            >
              {viewMode === "editor" ? (
                <Eye className="h-4 w-4" />
              ) : (
                <Pencil className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {isAuthenticated ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await logout();
                navigate("/");
              }}
            >
              Logout
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Login
            </Button>
          )}
        </div>
      </div>
    </header>

    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border-subtle/60 bg-background/90 backdrop-blur-xl md:hidden">
      <NavLink to="/" end className={bottomLinkClass}>
        <Home className="h-5 w-5" />
        Overview
      </NavLink>
      <NavLink to="/posts" className={bottomLinkClass}>
        <Rss className="h-5 w-5" />
        Posts
      </NavLink>
      {canAdmin && viewMode === "editor" && (
        <NavLink to="/admin" className={bottomLinkClass}>
          <ShieldCheck className="h-5 w-5" />
          Admin
        </NavLink>
      )}
    </nav>
    </>
  );
}
