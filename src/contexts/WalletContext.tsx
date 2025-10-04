import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  createWalletClient,
  createPublicClient,
  custom,
  type Address,
} from "viem";
import { baseSepolia } from "viem/chains";

interface WalletContextType {
  walletClient: any | null;
  publicClient: any | null;
  address: Address | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
  chainId: number;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletClient, setWalletClient] = useState<any | null>(null);
  const [publicClient, setPublicClient] = useState<any | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState(baseSepolia.id);

  const connect = async () => {
    try {
      setError(null);

      if (!window.ethereum) {
        throw new Error(
          "MetaMask is not installed. Please install MetaMask to use this app."
        );
      }

      // Request account access
      const [account] = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as Address[];

      // Create wallet client
      const wallet = createWalletClient({
        account,
        chain: baseSepolia,
        transport: custom(window.ethereum),
      });

      // Create public client
      const publicClientInstance = createPublicClient({
        chain: baseSepolia,
        transport: custom(window.ethereum),
      });

      setWalletClient(wallet);
      setPublicClient(publicClientInstance);
      setAddress(account);
      setIsConnected(true);
      setChainId(baseSepolia.id);

      console.log("Wallet connected:", account);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect wallet";
      setError(errorMessage);
      console.error("Wallet connection error:", err);
    }
  };

  const disconnect = () => {
    setWalletClient(null);
    setPublicClient(null);
    setAddress(null);
    setIsConnected(false);
    setError(null);
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          disconnect();
        } else {
          // Account changed
          setAddress(accounts[0] as Address);
        }
      };

      const handleChainChanged = (chainId: string) => {
        // Reload the page when chain changes
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  const value: WalletContextType = {
    walletClient,
    publicClient,
    address,
    isConnected,
    connect,
    disconnect,
    error,
    chainId,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

// Add ethereum to window type
declare global {
  interface Window {
    ethereum?: any;
  }
}
