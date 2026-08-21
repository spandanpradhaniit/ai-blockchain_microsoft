import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, polygonAmoy } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "AegisDAO Governance Platform",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "aegis_dao_default_id",
  chains: [sepolia, polygonAmoy],
  ssr: true,
});
