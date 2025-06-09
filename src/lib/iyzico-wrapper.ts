// Server-side only wrapper for iyzico to handle dynamic requires
// This file should only be imported in server-side code (API routes)

import type Iyzipay from 'iyzipay';

let IyzicoConstructor: typeof Iyzipay | null = null;

async function getIyzico(): Promise<typeof Iyzipay> {
  if (!IyzicoConstructor) {
    // Dynamic import only on server-side
    if (typeof window === 'undefined') {
      const iyzipayModule = await import('iyzipay');
      IyzicoConstructor = iyzipayModule.default;
    } else {
      throw new Error('iyzico can only be used on the server-side');
    }
  }
  return IyzicoConstructor;
}

export { getIyzico };
export type { Iyzipay }; 