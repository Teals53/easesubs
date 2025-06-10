"use client";

import { useNonce } from "@/lib/nonce-context";
import { AnalyticsScripts, PerformanceMonitoring } from "./seo-utils";
import { PerformanceSEO } from "./performance-seo";

interface NonceAwareScriptsProps {
  googleAnalyticsId?: string;
  gtmId?: string;
}

export function NonceAwareScripts({ googleAnalyticsId, gtmId }: NonceAwareScriptsProps) {
  const nonce = useNonce();

  return (
    <>
      <PerformanceSEO nonce={nonce} />
      <PerformanceMonitoring nonce={nonce} />
      {(googleAnalyticsId || gtmId) && (
        <AnalyticsScripts 
          googleAnalyticsId={googleAnalyticsId}
          gtmId={gtmId}
          nonce={nonce}
        />
      )}
    </>
  );
} 