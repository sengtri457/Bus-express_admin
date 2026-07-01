"use client";

import dynamic from "next/dynamic";

export const BarChart = dynamic(
  () => import("./bar-chart-inner").then((mod) => mod.BarChart),
  { ssr: false },
);
