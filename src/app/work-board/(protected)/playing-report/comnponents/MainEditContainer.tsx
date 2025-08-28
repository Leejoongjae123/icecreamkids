"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import ReportA from "./ReportA";

export default function MainEditContainer() {
  const searchParams = useSearchParams();
  const hasTypeA = searchParams.has("typeA");

  return (
    <div className="relative">
      {hasTypeA && <ReportA />}
      <div>MainEditContainer</div>
    </div>
  );
}
