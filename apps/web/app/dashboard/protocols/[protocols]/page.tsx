"use client";

import { useParams } from "next/navigation";

import { ProtocolDetailView } from "@/components/ProtocolDetailView";

export default function DashboardProtocolDetailPage() {
  const params = useParams<{ protocols: string }>();
  return <ProtocolDetailView protocolId={params.protocols} />;
}
