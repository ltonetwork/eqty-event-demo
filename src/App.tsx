import React, { useState } from "react";
import { WalletProvider } from "./contexts/WalletContext";
import { RelayProvider } from "./contexts/RelayContext";
import WalletConnect from "./components/WalletConnect";
import EventChainDemo from "./components/EventChainDemo";
import MessageDemo from "./components/MessageDemo";
import RelayStatus from "./components/RelayStatus";
import "./App.css";

type Page = "eventchain" | "messages";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("eventchain");

  return (
    <WalletProvider>
      <RelayProvider>
        <div className="min-h-screen bg-gray-900 text-white">
          {/* Header */}
          <header className="border-b border-gray-700 bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-8">
                  <h1 className="text-xl font-bold text-white font-mono">
                    EQTY Core Demo
                  </h1>

                  {/* Navigation */}
                  <nav className="flex space-x-6">
                    <button
                      onClick={() => setCurrentPage("eventchain")}
                      className={`px-4 py-2 rounded font-mono text-sm transition-colors ${
                        currentPage === "eventchain"
                          ? "bg-mint text-black font-bold"
                          : "text-gray-300 hover:text-white hover:bg-gray-700"
                      }`}
                    >
                      Event Chain
                    </button>
                    <button
                      onClick={() => setCurrentPage("messages")}
                      className={`px-4 py-2 rounded font-mono text-sm transition-colors ${
                        currentPage === "messages"
                          ? "bg-mint text-black font-bold"
                          : "text-gray-300 hover:text-white hover:bg-gray-700"
                      }`}
                    >
                      Messages
                    </button>
                  </nav>
                </div>

                <div className="flex items-center space-x-4">
                  <RelayStatus />
                  <WalletConnect />
                  <a
                    href="https://github.com/ltonetwork/eqty-core"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm"
                  >
                    GitHub
                  </a>
                  {/* <span className="text-mint font-mono text-sm">
                    npm i eqty-core
                  </span> */}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 py-6">
            {currentPage === "eventchain" && <EventChainDemo />}
            {currentPage === "messages" && <MessageDemo />}
          </main>
        </div>
      </RelayProvider>
    </WalletProvider>
  );
}

export default App;
