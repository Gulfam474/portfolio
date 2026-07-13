import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { authApi } from "@/api/authApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

const schema = z
  .object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8),
    confirm: z.string().min(8),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords must match",
    path: ["confirm"],
  });

type Form = z.infer<typeof schema>;

export function RegisterForm() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Form) => {
    setError("");
    try {
      await authApi.register({
        username: values.username,
        email: values.email,
        password: values.password,
      });
      navigate(`/verify-otp?email=${encodeURIComponent(values.email)}`);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Registration failed";
      setError(String(msg));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Username</Label>
        <Input {...register("username")} />
        {errors.username && (
          <p className="mt-1 text-xs text-red-400">{errors.username.message}</p>
        )}
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" {...register("email")} />
        {errors.email && (
          <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
        )}
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" {...register("password")} />
        {errors.password && (
          <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
        )}
      </div>
      <div>
        <Label>Confirm password</Label>
        <Input type="password" {...register("confirm")} />
        {errors.confirm && (
          <p className="mt-1 text-xs text-red-400">{errors.confirm.message}</p>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted">
        Have an account?{" "}
        <Link to="/login" className="text-accent-cyan hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
