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
    <div className="rounded-2xl border border-zinc-200 bg-gray-100 p-8 shadow-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-6 flex items-center justify-center">
          <Image
            src="/assets/images/Logo.png"
            alt="BusExpress Logo"
            width={200}
            height={200}
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          BusExpress Admin
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="admin@example.com"
          className="bg-zinc-50/50 border-zinc-200 focus:border-zinc-900 focus:ring-zinc-900"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="bg-zinc-50/50 border-zinc-200 focus:border-zinc-900 focus:ring-zinc-900"
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
          className="w-full gap-2 rounded-xl bg-blue-900 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:ring-zinc-900 active:scale-[0.98] transition-all"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          Sign in
        </Button>
      </form>
    </div>
  );
}
