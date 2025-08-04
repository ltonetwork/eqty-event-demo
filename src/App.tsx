import React, { useState, useEffect } from "react";
import "./App.css";
import WalletConnect from "./components/WalletConnect";
import EventChainDemo from "./components/EventChainDemo";
import MessageDemo from "./components/MessageDemo";
import { WalletProvider } from "./contexts/WalletContext";

function App() {
  return (
    <WalletProvider>
      <div className="App">
        <header className="App-header">
          <h1>EQTY Core Events Demo</h1>
          <p>Test the EQTY Core library with your wallet</p>
        </header>

        <main className="App-main">
          <WalletConnect />
          <EventChainDemo />
          <MessageDemo />
        </main>
      </div>
    </WalletProvider>
  );
}

export default App;
