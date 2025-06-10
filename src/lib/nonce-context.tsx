"use client";

import { createContext, useContext, ReactNode } from 'react';

interface NonceContextType {
  nonce?: string;
}

const NonceContext = createContext<NonceContextType>({});

export function useNonce(): string | undefined {
  const context = useContext(NonceContext);
  return context.nonce;
}

interface NonceProviderProps {
  nonce?: string;
  children: ReactNode;
}

export function NonceProvider({ nonce, children }: NonceProviderProps) {
  return (
    <NonceContext.Provider value={{ nonce }}>
      {children}
    </NonceContext.Provider>
  );
} 