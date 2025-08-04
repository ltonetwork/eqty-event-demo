import React from "react";
import { useWallet } from "../contexts/WalletContext";
import "./WalletConnect.css";

const WalletConnect: React.FC = () => {
  const { wallet, address, isConnected, connect, disconnect, error } =
    useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="wallet-connect">
      <h2>Wallet Connection</h2>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!isConnected ? (
        <div className="connect-section">
          <p>Connect your wallet to start testing EQTY Core events</p>
          <button className="connect-button" onClick={connect}>
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="connected-section">
          <div className="wallet-info">
            <p>
              <strong>Connected Address:</strong>{" "}
              {address && formatAddress(address)}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className="status-connected">Connected</span>
            </p>
          </div>
          <button className="disconnect-button" onClick={disconnect}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
