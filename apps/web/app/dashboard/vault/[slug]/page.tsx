"use client";

import { useParams } from "next/navigation";

import { VaultDetailView } from "@/components/Vault/VaultDetailView";

export default function DashboardVaultDetailPage() {
  const params = useParams<{ slug: string }>();
  return <VaultDetailView slug={params.slug} />;
}
