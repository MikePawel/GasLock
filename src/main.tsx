import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

import { type Chain } from "viem";
// import { mainnet } from "viem/chains";

export const neoX = {
  id: 47763,
  name: "NeoX",
  nativeCurrency: { name: "Gas", symbol: "Gas", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://mainnet-1.rpc.banelabs.org"] },
  },
  blockExplorers: {
    default: { name: "Xexplorer", url: "https://xexplorer.neo.org/" },
  },
} as const satisfies Chain;

const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: "YOUR_PROJECT_ID",
  chains: [neoX],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={47763}>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
