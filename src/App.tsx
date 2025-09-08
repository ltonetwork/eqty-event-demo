import React from "react";
import "./App.css";
import WalletConnect from "./components/WalletConnect";
import EventChainDemo from "./components/EventChainDemo";
import MessageDemo from "./components/MessageDemo";
import { WalletProvider } from "./contexts/WalletContext";

function App() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                EQTY Core Events Demo
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Experience the power of decentralized event anchoring on Base
                blockchain. Connect your wallet and start building with EQTY
                Core.
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            {/* Wallet Connection Section */}
            <section>
              <WalletConnect />
            </section>

            {/* Event Chain Demo Section */}
            <section>
              <EventChainDemo />
            </section>

            {/* Message Demo Section */}
            <section>
              <MessageDemo />
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-500">
              <p className="text-sm">
                Experiment and Test the usage of the Eqty Lib 👾
              </p>
            </div>
          </div>
        </footer>
      </div>
    </WalletProvider>
  );
}

export default App;
