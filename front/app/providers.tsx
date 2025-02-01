'use client';

import type { ReactNode } from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { baseSepolia } from "viem/chains";

export function Providers(props: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={baseSepolia}
      config={{
        appearance: {
          name: 'Onchain Buddy',
          logo: 'https://test-logo.com',
          mode: 'auto',
          theme: 'default'
        },
        wallet: {
          display: 'modal',
          termsUrl: 'https://...',
          privacyUrl: 'https://...'
        }
      }}
    >
      {props.children}
    </OnchainKitProvider>
  )
}