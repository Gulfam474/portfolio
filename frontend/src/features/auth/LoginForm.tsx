import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { authApi } from "@/api/authApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  username_or_email: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

type Form = z.infer<typeof schema>;

export function LoginForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Form) => {
    setError("");
    try {
      const { data } = await authApi.login(values);
      await loginWithToken(data.access_token);
      const returnTo = params.get("returnTo") || "/";
      navigate(returnTo);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Login failed";
      setError(String(msg));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Username or email</Label>
        <Input {...register("username_or_email")} autoComplete="username" />
        {errors.username_or_email && (
          <p className="mt-1 text-xs text-red-400">{errors.username_or_email.message}</p>
        )}
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" {...register("password")} autoComplete="current-password" />
        {errors.password && (
          <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
      <a
        href={authApi.googleLoginUrl(params.get("returnTo") || "/")}
        className="flex h-10 w-full items-center justify-center rounded-lg border border-border-subtle text-sm text-muted hover:border-accent-cyan/40 hover:text-white"
      >
        Continue with Google
      </a>
      <p className="text-center text-sm text-muted">
        No account?{" "}
        <Link to="/register" className="text-accent-cyan hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
