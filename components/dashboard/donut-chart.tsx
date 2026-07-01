"use client";

import dynamic from "next/dynamic";

export const DonutChart = dynamic(
  () => import("./donut-chart-inner").then((mod) => mod.DonutChart),
  { ssr: false },
);
