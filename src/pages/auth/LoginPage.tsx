import React, { useState } from "react";
import shamhoLogo from "../../assets/Shamho Logo.jpeg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthProvider";
import { FormInput } from "../../components/forms/FormInput";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setApiError(null);

    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4efe6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">SHAMHO</h1>
            <p className="text-text-secondary">FPO Management</p>
          </div>

          {apiError && (
            <div className="mb-4 p-4 bg-danger bg-opacity-10 border border-danger rounded-xl">
              <p className="text-sm text-danger">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <FormInput
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold !text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          <div className="mt-6 flex items-center justify-center">
            <img
              src={shamhoLogo}
              alt="SHAMHO logo"
              className="h-20 object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
