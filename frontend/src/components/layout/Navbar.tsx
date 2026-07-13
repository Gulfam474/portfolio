import { NavLink, useNavigate } from "react-router-dom";
import { Eye, Menu, Moon, Pencil, Sun, X } from "lucide-react";
import { useState } from "react";
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

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const canAdmin = usePermission("admin", "view");
  const canEditSite =
    usePermission("profile", "edit") ||
    usePermission("posts", "edit") ||
    usePermission("cv", "edit");
  const isOwner = user?.role?.name === "owner" || canEditSite;
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const viewMode = useUiStore((s) => s.viewMode);
  const toggleViewMode = useUiStore((s) => s.toggleViewMode);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
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

        <div className="flex items-center gap-1 md:hidden">
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
          <button
            className="rounded-md p-2 text-muted hover:bg-[color:var(--overlay-hover)] md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-3 border-t border-border-subtle px-4 py-4 md:hidden">
          <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>
            Overview
          </NavLink>
          <div>
            <NavLink to="/posts" className={linkClass} onClick={() => setOpen(false)}>
              Posts
            </NavLink>
          </div>
          {canAdmin && viewMode === "editor" && (
            <div>
              <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>
                Admin
              </NavLink>
            </div>
          )}
          {isAuthenticated && isOwner && (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => {
                toggleViewMode();
                setOpen(false);
              }}
            >
              {viewMode === "editor" ? "Read-only preview" : "Editor view"}
            </Button>
          )}
          <div className="pt-2">
            {isAuthenticated ? (
              <Button
                variant="secondary"
                className="w-full"
                onClick={async () => {
                  await logout();
                  setOpen(false);
                  navigate("/");
                }}
              >
                Logout
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setOpen(false);
                    navigate("/login");
                  }}
                >
                  Login
                </Button>
                <Button
                  className="btn-sheen flex-1"
                  onClick={() => {
                    setOpen(false);
                    navigate("/register");
                  }}
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
