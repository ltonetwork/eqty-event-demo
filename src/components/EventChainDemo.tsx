import React, { useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import { Event, EventChain, EthersSigner, AnchorClient, AnchorResult } from "@eqty-core/events";
import "./EventChainDemo.css";

// Real EQTY Core types
interface EventChainState {
  chain: EventChain;
  events: Event[];
  anchorResults: AnchorResult[];
}

const EventChainDemo: React.FC = () => {
  const { wallet, isConnected } = useWallet();
  const [chainId, setChainId] = useState("demo-chain-123");
  const [eventData, setEventData] = useState("");
  const [chainState, setChainState] = useState<EventChainState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [anchorClient, setAnchorClient] = useState<AnchorClient | null>(null);

  // Initialize anchor client when wallet connects
  React.useEffect(() => {
    if (isConnected && wallet) {
      // Use the deployed contract address on Base Sepolia
      const contractAddress = "0x7607af0cea78815c71bbea90110b2c218879354b";
      const client = new AnchorClient(contractAddress, wallet);
      setAnchorClient(client);
    }
  }, [isConnected, wallet]);

  const addEvent = async () => {
    if (!isConnected || !wallet) {
      setMessage("Please connect your wallet first");
      return;
    }

    if (!eventData.trim()) {
      setMessage("Please enter event data");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      // Create EQTY signer
      const eqtySigner = new EthersSigner(wallet);

      // Create or get existing chain
      let currentChain = chainState?.chain || new EventChain(chainId);

      // Create and sign event
      const event = new Event(JSON.parse(eventData), "application/json");
      await event.signWith(eqtySigner);
      
      // Add to chain
      currentChain.addEvent(event);

      // Update state
      const newEvents = [...(chainState?.events || []), event];
      setChainState({
        chain: currentChain,
        events: newEvents,
        anchorResults: chainState?.anchorResults || [],
      });

      setEventData("");
      setMessage("Event added and signed successfully!");
    } catch (error) {
      setMessage(
        `Error: ${
          error instanceof Error ? error.message : "Failed to add event"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearEvents = () => {
    setChainState(null);
    setMessage("Events cleared");
  };

  const getAnchorMap = () => {
    if (!chainState || chainState.events.length === 0) {
      setMessage("No events to anchor");
      return;
    }

    const anchorMap = chainState.chain.getAnchorMap();
    setMessage(`Anchor Map: ${JSON.stringify(anchorMap.map(a => ({
      key: a.key.hex,
      value: a.value.hex
    })), null, 2)}`);
  };

  const anchorToBlockchain = async () => {
    if (!chainState || !anchorClient) {
      setMessage("No chain to anchor or anchor client not ready");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const anchorMap = chainState.chain.getAnchorMap();
      const results = await anchorClient.anchorMany(anchorMap);

      // Check results
      const failedResults = results.filter(r => !r.success);
      if (failedResults.length > 0) {
        setMessage(`Some anchors failed: ${failedResults.map(r => r.error).join(', ')}`);
      } else {
        setMessage(`Successfully anchored ${results.length} items to blockchain!`);
      }

      // Update state with results
      setChainState({
        ...chainState,
        anchorResults: [...chainState.anchorResults, ...results],
      });
    } catch (error) {
      setMessage(
        `Anchoring failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="event-chain-demo">
      <h2>Event Chain Demo</h2>

      {!isConnected ? (
        <div className="not-connected">
          <p>Please connect your wallet to test event chains</p>
        </div>
      ) : (
        <div className="demo-content">
          <div className="chain-config">
            <label>
              Chain ID:
              <input
                type="text"
                value={chainId}
                onChange={(e) => setChainId(e.target.value)}
                placeholder="Enter chain ID"
              />
            </label>
          </div>

          <div className="event-input">
            <label>
              Event Data (JSON):
              <textarea
                value={eventData}
                onChange={(e) => setEventData(e.target.value)}
                placeholder='{"action": "user_login", "timestamp": 1234567890}'
                rows={3}
              />
            </label>
            <button
              onClick={addEvent}
              disabled={isLoading || !eventData.trim()}
              className="add-event-button"
            >
              {isLoading ? "Adding Event..." : "Add Event"}
            </button>
          </div>

          <div className="actions">
            <button onClick={getAnchorMap} className="anchor-button">
              Get Anchor Map
            </button>
            <button 
              onClick={anchorToBlockchain} 
              className="anchor-button"
              disabled={!chainState || chainState.events.length === 0 || !anchorClient}
            >
              Anchor to Blockchain
            </button>
            <button onClick={clearEvents} className="clear-button">
              Clear Events
            </button>
          </div>

          {message && (
            <div className="message">
              <pre>{message}</pre>
            </div>
          )}

          <div className="events-list">
            <h3>Events ({chainState?.events.length || 0})</h3>
            {!chainState || chainState.events.length === 0 ? (
              <p>No events yet. Add some events to see them here.</p>
            ) : (
              <div className="events-container">
                {chainState.events.map((event, index) => (
                  <div key={index} className="event-item">
                    <div className="event-header">
                      <span className="event-number">#{index + 1}</span>
                      <span className="event-timestamp">
                        {new Date(event.timestamp || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="event-data">
                      <strong>Data:</strong>
                      <pre>{JSON.stringify(event.parsedData, null, 2)}</pre>
                    </div>
                    <div className="event-hash">
                      <strong>Hash:</strong>
                      <code>{event.hash.hex}</code>
                    </div>
                    <div className="event-signature">
                      <strong>Signature:</strong>
                      <code>{event.signature?.hex.slice(0, 20)}...</code>
                    </div>
                    <div className="event-verification">
                      <strong>Verified:</strong>
                      <span className={event.verifySignature() ? "verified" : "not-verified"}>
                        {event.verifySignature() ? "✓ Valid" : "✗ Invalid"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {chainState?.anchorResults && chainState.anchorResults.length > 0 && (
            <div className="anchor-results">
              <h3>Anchor Results ({chainState.anchorResults.length})</h3>
              <div className="results-container">
                {chainState.anchorResults.map((result, index) => (
                  <div key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
                    <div className="result-header">
                      <span className="result-number">#{index + 1}</span>
                      <span className="result-status">
                        {result.success ? "✓ Success" : "✗ Failed"}
                      </span>
                    </div>
                    {result.success && (
                      <div className="result-details">
                        <div><strong>Transaction:</strong> {result.transactionHash}</div>
                        <div><strong>Block:</strong> {result.blockNumber}</div>
                        <div><strong>Gas Used:</strong> {result.gasUsed?.toString()}</div>
                      </div>
                    )}
                    {!result.success && (
                      <div className="result-error">
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventChainDemo;
