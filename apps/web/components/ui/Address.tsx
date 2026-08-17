"use client";

import { useState, type MouseEvent } from "react";
import { PiArrowSquareOut, PiCheck, PiCopy } from "react-icons/pi";
import { fmtAddress } from "@/shared/format";

const EXPLORERS: Record<string, string> = {
  ethereum: "https://etherscan.io/address/",
  sepolia: "https://sepolia.etherscan.io/address/",
  goerli: "https://goerli.etherscan.io/address/",
  base: "https://basescan.org/address/",
  "base-sepolia": "https://sepolia.basescan.org/address/",
  arbitrum: "https://arbiscan.io/address/",
  optimism: "https://optimistic.etherscan.io/address/",
  polygon: "https://polygonscan.com/address/",
};

const SIZE_CLASSES = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
} as const;

interface AddressProps {
  address: string;
  /** Looked up in EXPLORERS (case-insensitive); unrecognized values fall back to Etherscan mainnet. */
  chain?: string;
  /** Explicit explorer base URL (address appended directly) - overrides `chain`, for explorers not in EXPLORERS. */
  explorerUrl?: string;
  size?: keyof typeof SIZE_CLASSES;
  /** Leading/trailing characters kept when truncating - defaults match fmtAddress's own default (6/4). */
  lead?: number;
  trail?: number;
  /** Show the full address instead of truncating. */
  full?: boolean;
  /** Render as a link out to the explorer, with an external-link glyph. Default true. */
  linkable?: boolean;
  /** Show the copy-to-clipboard icon. Default true. */
  copyable?: boolean;
  className?: string;
}

export function Address({
  address,
  chain = "ethereum",
  explorerUrl,
  size = "xs",
  lead = 6,
  trail = 4,
  full = false,
  linkable = true,
  copyable = true,
  className = "",
}: AddressProps) {
  const [copied, setCopied] = useState(false);
  const label = full ? address : fmtAddress(address, lead, trail);
  const explorerKey = chain.trim().toLowerCase().replace(/\s+/g, "-");
  const href = explorerUrl ?? `${EXPLORERS[explorerKey] ?? EXPLORERS.ethereum}${address}`;

  const handleCopy = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-muted ${SIZE_CLASSES[size]} ${className}`}>
      {linkable ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          title={address}
          className="inline-flex items-center gap-1 transition-colors hover:text-violet-bright"
        >
          {label}
          <PiArrowSquareOut className="size-3 shrink-0" />
        </a>
      ) : (
        <span title={address}>{label}</span>
      )}
      {copyable && (
        <button
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy address"}
          className="inline-flex shrink-0 text-muted/60 transition-colors hover:text-body"
        >
          {copied ? <PiCheck className="size-3" /> : <PiCopy className="size-3" />}
        </button>
      )}
    </span>
  );
}
