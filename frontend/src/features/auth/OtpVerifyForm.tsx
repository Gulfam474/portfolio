import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { authApi } from "@/api/authApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  otp: z.string().length(6, "Enter the 6-digit code"),
});

type Form = z.infer<typeof schema>;

export function OtpVerifyForm() {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const onSubmit = async (values: Form) => {
    setError("");
    try {
      const { data } = await authApi.verifyOtp({ email, otp: values.otp });
      await loginWithToken(data.access_token);
      navigate("/");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Invalid OTP";
      setError(String(msg));
    }
  };

  const resend = async () => {
    if (!email || seconds > 0) return;
    try {
      await authApi.resendOtp(email);
      setSeconds(60);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Could not resend";
      setError(String(msg));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-muted">
        Enter the code sent to <span className="text-white">{email}</span>. In
        development without SMTP, check the backend console for the OTP.
      </p>
      <div>
        <Label>6-digit OTP</Label>
        <Input
          {...register("otp")}
          maxLength={6}
          className="font-mono tracking-[0.4em]"
          placeholder="000000"
        />
        {errors.otp && (
          <p className="mt-1 text-xs text-red-400">{errors.otp.message}</p>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Verify
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={seconds > 0}
        onClick={resend}
      >
        {seconds > 0 ? `Resend in ${seconds}s` : "Resend OTP"}
      </Button>
    </form>
  );
}
