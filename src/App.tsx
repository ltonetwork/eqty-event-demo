import React from "react";
import { WalletProvider } from "./contexts/WalletContext";
import { RelayProvider } from "./contexts/RelayContext";
import WalletConnect from "./components/WalletConnect";
import EventChainDemo from "./components/EventChainDemo";
import MessageDemo from "./components/MessageDemo";
import RelayStatus from "./components/RelayStatus";
import "./App.css";

function App() {
  return (
    <WalletProvider>
      <RelayProvider>
        <div className="min-h-screen bg-black text-white">
          {/* Header */}
          <header className="border-b border-white">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <h1 className="text-lg font-bold text-white font-mono">
                    EQTY Core Demo
                  </h1>
                </div>
                <div className="flex items-center space-x-4">
                  <RelayStatus />
                  <a
                    href="https://github.com/ltonetwork/eqty-core"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm"
                  >
                    GitHub
                  </a>
                  <span className="text-mint font-mono text-sm">
                    npm i eqty-core
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WalletConnect />
              <EventChainDemo />
              <MessageDemo />
            </div>
          </main>
        </div>
      </RelayProvider>
    </WalletProvider>
  );
}

export default App;
