import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "@rainbow-me/rainbowkit/styles.css";

import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
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
  projectId: import.meta.env.VITE_PROJECT_ID,
  chains: [neoX],
  ssr: true,
});

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#0be7a3",
            accentColorForeground: "black",
            borderRadius: "small",
            fontStack: "system",
            overlayBlur: "small",
          })}
          initialChain={47763}
          locale="en-US"
        >
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
