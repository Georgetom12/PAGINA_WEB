import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, bsc } from "@reown/appkit/networks";

export const PROJECT_ID = "7ebe8a501585ab781a04272a1de56185";

const metadata = {
  name: "PSY Wallet",
  description: "PSY EXCHANGE — DEX Aggregator · Jupiter · 0x Protocol",
  url: "https://psychometriks.pages.dev",
  icons: ["https://psychometriks.pages.dev/icon-192x192.png"],
};

export const networks = [mainnet, bsc] as [typeof mainnet, typeof bsc];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: PROJECT_ID,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId: PROJECT_ID,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: [],
    onramp: false,
    swaps: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-color-mix": "#00e5ff",
    "--w3m-color-mix-strength": 20,
    "--w3m-accent": "#00e5ff",
    "--w3m-border-radius-master": "0px",
    "--w3m-font-family": "'Space Grotesk', sans-serif",
  },
});
