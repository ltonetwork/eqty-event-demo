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

  return (
    <div className="card">
      <h2 className="section-header">Wallet</h2>

      {!isConnected ? (
        <div className="space-y-4">
          <button onClick={connect} className="btn-primary w-full">
            Connect Wallet
          </button>
          {error && (
            <div className="text-red-400 font-mono text-sm">{error}</div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white font-mono">Address:</span>
              <span className="text-mint font-mono">
                {formatAddress(address || "")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white font-mono">Network:</span>
              <span className="text-mint font-mono">
                {getChainName(chainId)}
              </span>
            </div>
          </div>
          <button onClick={disconnect} className="btn-danger w-full">
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
