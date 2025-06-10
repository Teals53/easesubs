/**
 * Content Security Policy Utilities
 * Helpers for managing and debugging CSP policies
 */

import { CSP_DIRECTIVES } from "./security-config";

/**
 * Parse CSP directive into a more readable format
 */
export function parseCSPDirective(csp: string): Record<string, string[]> {
  const directives: Record<string, string[]> = {};

  csp.split(";").forEach((directive) => {
    const trimmed = directive.trim();
    if (!trimmed) return;

    const [name, ...values] = trimmed.split(/\s+/);
    if (name) {
      directives[name] = values;
    }
  });

  return directives;
}

/**
 * Generate a cryptographically secure nonce for CSP
 */
export function generateNonce(): string {
  if (typeof crypto === "undefined") {
    // Fallback for environments without crypto
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array))).replace(
    /[+/=]/g,
    "",
  );
}

/**
 * Get nonce from request headers (set by middleware)
 */
export async function getNonce(): Promise<string | undefined> {
  try {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    return headersList.get("x-csp-nonce") || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Get current CSP policy based on environment
 */
export function getCurrentCSP(nonce?: string): string[] {
  if (process.env.NODE_ENV === "development") {
    return CSP_DIRECTIVES.development;
  } else {
    return CSP_DIRECTIVES.production(nonce);
  }
}

/**
 * Check if a domain is allowed in CSP for a specific directive
 */
export function isDomainAllowed(domain: string, directive: string): boolean {
  const currentCSP = getCurrentCSP();
  const cspString = currentCSP.join("; ");
  const parsed = parseCSPDirective(cspString);

  const relevantDirective = parsed[directive];
  if (!relevantDirective) return false;

  return (
    relevantDirective.includes(domain) ||
    relevantDirective.includes("'self'") ||
    relevantDirective.includes("https:") ||
    relevantDirective.includes("*")
  );
}

/**
 * Generate a report of CSP differences between development and production
 */
export function getCSPDifferences(): {
  developmentOnly: string[];
  productionOnly: string[];
  common: string[];
} {
  const dev = new Set(CSP_DIRECTIVES.development);
  const prod = new Set(CSP_DIRECTIVES.production()); // Call function with no nonce

  const developmentOnly = Array.from(dev).filter((x) => !prod.has(x));
  const productionOnly = Array.from(prod).filter((x) => !dev.has(x));
  const common = Array.from(dev).filter((x) => prod.has(x));

  return { developmentOnly, productionOnly, common };
}

/**
 * Validate that required security directives are present
 */
export function validateCSPSecurity(directives: string[]): {
  isSecure: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const cspString = directives.join("; ");
  const parsed = parseCSPDirective(cspString);

  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check for unsafe directives
  if (parsed["script-src"]?.includes("'unsafe-inline'")) {
    warnings.push(
      "script-src allows 'unsafe-inline' which can lead to XSS vulnerabilities",
    );
    recommendations.push(
      "Consider using nonce or hash-based CSP for inline scripts",
    );
  }

  if (parsed["script-src"]?.includes("'unsafe-eval'")) {
    warnings.push(
      "script-src allows 'unsafe-eval' which can lead to code injection",
    );
    recommendations.push(
      "Avoid eval() and similar functions, use safer alternatives",
    );
  }

  if (parsed["style-src"]?.includes("'unsafe-inline'")) {
    warnings.push(
      "style-src allows 'unsafe-inline' which can lead to style injection",
    );
    recommendations.push(
      "Consider using nonce or hash-based CSP for inline styles",
    );
  }

  // Check for missing important directives
  if (!parsed["frame-src"] && !parsed["frame-ancestors"]) {
    recommendations.push(
      "Consider adding frame-src or frame-ancestors to prevent clickjacking",
    );
  }

  if (!parsed["object-src"]) {
    recommendations.push(
      "Consider adding object-src 'none' to prevent plugin-based attacks",
    );
  }

  if (!parsed["base-uri"]) {
    recommendations.push(
      "Consider adding base-uri 'self' to prevent base tag injection",
    );
  }

  const isSecure = warnings.length === 0;

  return { isSecure, warnings, recommendations };
}

/**
 * Generate CSP meta tag for HTML head (useful for debugging)
 */
export function generateCSPMetaTag(nonce?: string): string {
  const csp = getCurrentCSP(nonce).join("; ");
  return `<meta http-equiv="Content-Security-Policy" content="${csp}">`;
}

/**
 * Log CSP information for debugging (development only)
 */
export function debugCSP(): void {
  if (process.env.NODE_ENV !== "development") return;

  console.group("🔒 Content Security Policy Debug Info");
  console.log("Current CSP:", getCurrentCSP());

  const validation = validateCSPSecurity(getCurrentCSP());
  if (validation.warnings.length > 0) {
    console.warn("⚠️ Security Warnings:", validation.warnings);
  }

  if (validation.recommendations.length > 0) {
    console.info("💡 Recommendations:", validation.recommendations);
  }

  const differences = getCSPDifferences();
  console.log("📊 Development vs Production differences:", differences);

  console.groupEnd();
}

/**
 * Convert CSP directives array to string
 */
export function stringifyCSPDirectives(directives: string[]): string {
  return directives.join("; ");
}

/**
 * Add a directive to existing CSP directives
 */
export function addCSPDirective(
  directives: string[],
  newDirective: string,
): string[] {
  // Check if directive type already exists
  const directiveType = newDirective.split(" ")[0];
  const existingIndex = directives.findIndex((d) =>
    d.startsWith(directiveType),
  );

  if (existingIndex >= 0) {
    // Replace existing directive
    const updatedDirectives = [...directives];
    updatedDirectives[existingIndex] = newDirective;
    return updatedDirectives;
  } else {
    // Add new directive
    return [...directives, newDirective];
  }
}
