import { headers } from "next/headers";
import { NonceProvider } from "@/lib/nonce-context";
import { ReactNode } from "react";

interface ServerNonceProviderProps {
  children: ReactNode;
}

export async function ServerNonceProvider({ children }: ServerNonceProviderProps) {
  const headersList = await headers();
  const nonce = headersList.get('x-csp-nonce') || undefined;

  return (
    <NonceProvider nonce={nonce}>
      {children}
    </NonceProvider>
  );
} 