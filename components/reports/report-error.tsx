"use client";

import { useEffect } from "react";

interface ReportErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export function ReportError({ error, unstable_retry }: ReportErrorProps) {
  useEffect(() => {
    console.error("Report failed to load", error);
  }, [error]);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h2 className="text-lg font-semibold text-red-900">
        The report could not be loaded
      </h2>
      <p className="mt-2 text-sm text-red-700">
        No placeholder totals were shown because one or more report queries
        failed. Please try again.
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
      >
        Retry report
      </button>
    </div>
  );
}
