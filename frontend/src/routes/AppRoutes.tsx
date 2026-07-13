import { Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { Atmosphere } from "@/components/layout/Atmosphere";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { PermissionGate } from "@/components/layout/PermissionGate";
import { OverviewPage } from "@/features/profile-overview/OverviewPage";
import { PostFeed } from "@/features/posts/PostFeed";
import { LoginForm } from "@/features/auth/LoginForm";
import { RegisterForm } from "@/features/auth/RegisterForm";
import { OtpVerifyForm } from "@/features/auth/OtpVerifyForm";
import { AdminAccessPage } from "@/features/admin-access/AdminAccessPage";
import { useAuth } from "@/hooks/useAuth";
import { BrandMark } from "@/components/layout/BrandMark";
import { BRAND_TAG } from "@/lib/constants";

function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <BrandMark size="lg" />
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {BRAND_TAG}
        </p>
      </div>
      <div className="glass-card p-6">
        <p className="label-mono">auth</p>
        <h1 className="mt-1 mb-6 text-2xl font-semibold text-white">{title}</h1>
        {children}
      </div>
    </div>
  );
}

function AuthCallback() {
  const [params] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("access_token");
    const returnTo = params.get("returnTo") || "/";
    if (!token) {
      navigate("/login");
      return;
    }
    loginWithToken(token).then(() =>
      navigate(returnTo.startsWith("/") ? returnTo : "/"),
    );
  }, [params, loginWithToken, navigate]);

  return <p className="p-8 text-center text-muted">Completing Google sign-in…</p>;
}

export function AppRoutes() {
  return (
    <div className="relative min-h-screen">
      <Atmosphere />
      <Navbar />
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/posts" element={<PostFeed />} />
        <Route
          path="/login"
          element={
            <AuthShell title="Sign in">
              <LoginForm />
            </AuthShell>
          }
        />
        <Route
          path="/register"
          element={
            <AuthShell title="Create account">
              <RegisterForm />
            </AuthShell>
          }
        />
        <Route
          path="/verify-otp"
          element={
            <AuthShell title="Verify email">
              <OtpVerifyForm />
            </AuthShell>
          }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <PermissionGate
                module="admin"
                action="view"
                fallback={
                  <p className="p-10 text-center text-muted">
                    You do not have admin access.
                  </p>
                }
              >
                <AdminAccessPage />
              </PermissionGate>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
