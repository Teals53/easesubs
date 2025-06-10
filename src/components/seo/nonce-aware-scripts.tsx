"use client";

import { useNonce } from "@/lib/nonce-context";
import { PerformanceSEO } from "./performance-seo";

export function NonceAwareScripts() {
  const nonce = useNonce();

  return (
    <>
      <PerformanceSEO nonce={nonce} />
    </>
  );
}
