# Content Security Policy (CSP) Solution

## Overview

This document explains the CSP (Content Security Policy) implementation that resolves the inline script and style violations you were experiencing.

## Problem

You were seeing these CSP violations:

- Refused to execute inline script because it violates CSP directive "script-src"
- Refused to apply inline style because it violates CSP directive "style-src"

## Solution Implemented

### 1. Nonce-Based CSP

- **Middleware Enhancement**: Updated `middleware.ts` to generate a unique nonce for each request
- **Dynamic CSP Headers**: CSP headers are now set dynamically in middleware with the generated nonce
- **Component Updates**: Updated React components to use nonces for inline scripts and styles

### 2. Hash-Based CSP for Static Content

- **Static Hashes**: Added specific SHA256 hashes for common Next.js inline styles
- **Error-Based Hashes**: Included hashes from your browser error messages

### 3. Development vs Production

```typescript
// Development: Allow unsafe-inline for easier development
"script-src 'self' 'unsafe-inline' 'unsafe-eval' ...";
"style-src 'self' 'unsafe-inline' ...";

// Production: Use nonces and hashes
"script-src 'self' 'nonce-{DYNAMIC_NONCE}' 'sha256-...' ...";
"style-src 'self' 'nonce-{DYNAMIC_NONCE}' 'sha256-...' ...";
```

## Files Modified

### Core CSP Configuration

- `src/lib/security-config.ts` - Updated CSP directives with nonce support
- `src/lib/csp-utils.ts` - Added nonce generation and CSP utilities
- `middleware.ts` - Enhanced to generate nonces and set CSP headers

### Component Updates

- `src/lib/nonce-context.tsx` - Context for sharing nonces with components
- `src/components/seo/nonce-provider.tsx` - Server component for nonce provision
- `src/components/seo/nonce-aware-scripts.tsx` - Client components using nonces
- `src/components/seo/seo-utils.tsx` - Updated analytics scripts with nonce support
- `src/components/seo/performance-seo.tsx` - Updated performance monitoring with nonces
- `src/app/layout.tsx` - Updated to use nonce-aware components

### Development Tools

- `src/lib/csp-dev-utils.ts` - Development utilities for CSP debugging

## How It Works

### 1. Request Flow

```
1. Request comes in → Middleware generates nonce
2. Middleware sets CSP header with nonce
3. Nonce passed to React components via headers
4. Components use nonce for inline scripts/styles
```

### 2. Component Usage

```tsx
// Server component gets nonce from headers
export async function ServerNonceProvider({ children }) {
  const nonce = await getNonce();
  return <NonceProvider nonce={nonce}>{children}</NonceProvider>;
}

// Client component uses nonce
export function MyComponent() {
  const nonce = useNonce();
  return <Script nonce={nonce}>/* inline script */</Script>;
}
```

## Testing the Solution

### 1. Development Testing

```bash
npm run dev
```

- CSP allows `unsafe-inline` for easier development
- Development tools available for CSP debugging

### 2. Production Testing

```bash
npm run build
npm start
```

- CSP uses nonces and hashes only
- All inline content should work without violations

### 3. CSP Debugging (Development Only)

Add to any component:

```tsx
import { initCSPDebugging } from "@/lib/csp-dev-utils";

useEffect(() => {
  initCSPDebugging();
}, []);
```

This will:

- Log CSP violations with helpful information
- Extract all inline content and generate hashes
- Provide `window.generateCSPHash(content)` function

## Adding New Inline Content

### For Scripts

```tsx
import { useNonce } from "@/lib/nonce-context";

function MyComponent() {
  const nonce = useNonce();
  return (
    <Script nonce={nonce}>{`console.log('This will work with CSP');`}</Script>
  );
}
```

### For Styles

```tsx
import { useNonce } from "@/lib/nonce-context";

function MyComponent() {
  const nonce = useNonce();
  return <style nonce={nonce}>{`.my-class { color: red; }`}</style>;
}
```

### For Static Content (Alternative)

If you have static inline content, generate its hash and add to CSP:

```bash
# Generate hash for static content
echo -n "your inline content" | openssl dgst -sha256 -binary | openssl base64
```

Add the hash to `src/lib/security-config.ts`:

```typescript
`script-src 'self' 'sha256-YOUR_GENERATED_HASH' ...`;
```

## Security Benefits

1. **XSS Protection**: Prevents execution of unauthorized inline scripts
2. **Style Injection Prevention**: Blocks malicious inline styles
3. **Flexible but Secure**: Allows legitimate inline content via nonces/hashes
4. **Development Friendly**: Relaxed rules in development, strict in production

## Troubleshooting

### New CSP Violations

1. Use development debugging tools to identify the content
2. Generate hash for static content OR use nonce for dynamic content
3. Add hash to CSP configuration OR ensure component uses nonce

### Nonce Not Working

1. Check middleware is generating nonces (`x-csp-nonce` header)
2. Verify components are wrapped in `ServerNonceProvider`
3. Ensure components use `useNonce()` hook

### Development vs Production Issues

- Development allows `unsafe-inline` for convenience
- Production requires proper nonces/hashes
- Test in production mode locally before deploying

## Performance Impact

- **Minimal**: Nonce generation is fast (cryptographically secure random bytes)
- **Cacheable**: Static hashes can be cached
- **Efficient**: Middleware runs once per request
