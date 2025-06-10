export interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  stripScripts?: boolean;
  stripHtml?: boolean;
  maxLength?: number;
}

// Default secure sanitization options
const DEFAULT_OPTIONS: SanitizationOptions = {
  allowedTags: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li"],
  allowedAttributes: {
    a: ["href", "title"],
  },
  stripScripts: true,
  stripHtml: false,
  maxLength: 10000,
};

/**
 * Simple HTML sanitization - removes dangerous tags and attributes
 * Note: For production use, consider using a dedicated library like DOMPurify
 */
export function sanitizeHtml(
  input: string,
  options: SanitizationOptions = DEFAULT_OPTIONS,
): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Check length limit
  if (options.maxLength && input.length > options.maxLength) {
    throw new Error(
      `Input exceeds maximum length of ${options.maxLength} characters`,
    );
  }

  // If stripHtml is true, remove all HTML tags
  if (options.stripHtml) {
    return input.replace(/<[^>]*>/g, "").trim();
  }

  let sanitized = input;

  // Remove dangerous tags
  const dangerousTags = [
    "script",
    "object",
    "embed",
    "applet",
    "meta",
    "iframe",
    "form",
    "input",
    "link",
    "style",
  ];
  dangerousTags.forEach((tag) => {
    const regex = new RegExp(`<\\/?${tag}[^>]*>`, "gi");
    sanitized = sanitized.replace(regex, "");
  });

  // Remove dangerous attributes
  const dangerousAttrs = [
    "onclick",
    "onload",
    "onerror",
    "onmouseover",
    "onfocus",
    "onblur",
    "onsubmit",
    "onchange",
    "javascript:",
    "vbscript:",
    "data:",
  ];
  dangerousAttrs.forEach((attr) => {
    const regex = new RegExp(`\\s*${attr}\\s*=\\s*[^\\s>]*`, "gi");
    sanitized = sanitized.replace(regex, "");
  });

  // If allowedTags is specified, remove all other tags
  if (options.allowedTags && options.allowedTags.length > 0) {
    // This is a simplified approach - for production, use a proper HTML parser
    const allowedPattern = options.allowedTags.join("|");
    const tagRegex = new RegExp(
      `<(?!/?(?:${allowedPattern})(?:\\s|>))[^>]*>`,
      "gi",
    );
    sanitized = sanitized.replace(tagRegex, "");
  }

  return sanitized.trim();
}

/**
 * Sanitize plain text input
 */
export function sanitizeText(input: string, maxLength = 1000): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, "");

  // Remove null bytes and other dangerous characters
  sanitized = sanitized.replace(/\0/g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  // Check length
  if (sanitized.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  }

  return sanitized;
}

/**
 * Sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return "";
  }

  // Basic email sanitization
  const sanitized = email.toLowerCase().trim();

  // Check for basic email format (more thorough validation should be done with a proper library)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error("Invalid email format");
  }

  // Check for suspicious patterns
  if (
    sanitized.includes("..") ||
    (sanitized.includes("+") && sanitized.split("+").length > 2)
  ) {
    throw new Error("Suspicious email format detected");
  }

  return sanitized;
}

/**
 * Sanitize URL inputs
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== "string") {
    return "";
  }

  const trimmed = url.trim();

  // Allow only HTTP/HTTPS URLs
  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Only HTTP and HTTPS URLs are allowed");
    }

    // Check for suspicious patterns
    if (
      parsed.hostname.includes("localhost") &&
      process.env.NODE_ENV === "production"
    ) {
      throw new Error("Localhost URLs not allowed in production");
    }

    return parsed.toString();
  } catch {
    throw new Error("Invalid URL format");
  }
}

/**
 * Sanitize file names
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== "string") {
    return "";
  }

  // Remove path traversal attempts
  let sanitized = fileName.replace(/\.\./g, "");

  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1f]/g, "");

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, "");

  // Check for reserved names (Windows)
  const reservedNames = [
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
  ];
  if (reservedNames.includes(sanitized.toUpperCase())) {
    sanitized = `file_${sanitized}`;
  }

  // Ensure minimum length
  if (sanitized.length === 0) {
    throw new Error("Invalid file name");
  }

  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }

  return sanitized;
}

/**
 * Sanitize search queries
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== "string") {
    return "";
  }

  // Remove HTML tags
  let sanitized = query.replace(/<[^>]*>/g, "");

  // Remove SQL injection patterns
  sanitized = sanitized.replace(/[\';\"\\]/g, "");

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  // Limit length
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }

  return sanitized;
}

/**
 * Validate and sanitize JSON input
 */
export function sanitizeJson(input: string, maxDepth = 10): unknown {
  if (!input || typeof input !== "string") {
    throw new Error("Invalid JSON input");
  }

  try {
    // Parse JSON with depth limit check
    const parsed = JSON.parse(input);

    // Check depth recursively
    function checkDepth(obj: unknown, depth = 0): void {
      if (depth > maxDepth) {
        throw new Error("JSON depth exceeds maximum allowed");
      }

      if (typeof obj === "object" && obj !== null) {
        if (Array.isArray(obj)) {
          obj.forEach((item) => checkDepth(item, depth + 1));
        } else {
          Object.values(obj).forEach((value) => checkDepth(value, depth + 1));
        }
      }
    }

    checkDepth(parsed);
    return parsed;
  } catch (error) {
    throw new Error(
      `Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
