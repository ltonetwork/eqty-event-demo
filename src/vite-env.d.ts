/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RELAY_URL: string;
  readonly VITE_BASE_SEPOLIA_RPC_URL: string;
  readonly VITE_BASE_MAINNET_RPC_URL: string;
  readonly VITE_DEFAULT_MESSAGE_LIMIT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

