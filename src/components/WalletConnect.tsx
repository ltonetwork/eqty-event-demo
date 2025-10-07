import React from "react";
import { useWallet } from "../contexts/WalletContext";

const WalletConnect: React.FC = () => {
  const { address, isConnected, connect, disconnect, error, chainId } =
    useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 84532:
        return "Base Sepolia";
      case 8453:
        return "Base Mainnet";
      default:
        return `Chain ${chainId}`;
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <button onClick={connect} className="btn-primary text-sm px-3 py-1">
          Connect Wallet
        </button>
        {error && (
          <div className="text-red-400 font-mono text-xs max-w-32 truncate">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="text-right">
        <div className="text-white font-mono text-sm">
          {formatAddress(address || "")}
        </div>
        <div className="text-gray-400 font-mono text-xs">
          {getChainName(chainId)}
        </div>
      </div>
      <button
        onClick={disconnect}
        className="text-gray-400 hover:text-white text-sm px-2 py-1 border border-gray-600 rounded hover:border-gray-500 transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
};

export default WalletConnect;
