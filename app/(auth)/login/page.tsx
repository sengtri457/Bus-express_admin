"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-[32rem] items-center gap-12 lg:gap-20">
      {/* Left: Logo */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
        <Image
          src="/assets/images/bus.png"
          alt="BusExpress Logo"
          width={280}
          height={280}
          className="object-contain"
          priority
        />
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-1/2">
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Sign in to your admin account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@company.com"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
            />

            {error && (
              <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <svg
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-800 active:scale-[0.98] transition-all"
            >
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
