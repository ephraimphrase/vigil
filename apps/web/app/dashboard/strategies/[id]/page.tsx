"use client";

import { useParams } from "next/navigation";

import { StrategyDetailView } from "@/components/StrategyDetailView";

export default function DashboardStrategyDetailPage() {
  const params = useParams<{ id: string }>();
  return <StrategyDetailView id={params.id} />;
}
