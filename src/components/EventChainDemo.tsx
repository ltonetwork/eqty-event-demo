import React, { useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import "./EventChainDemo.css";

// Mock EQTY Core types for demo (we'll replace these with actual imports later)
interface Event {
  id: string;
  data: any;
  timestamp: number;
  signature?: string;
}

interface EventChain {
  id: string;
  events: Event[];
  stateHash?: string;
}

const EventChainDemo: React.FC = () => {
  const { wallet, isConnected } = useWallet();
  const [chainId, setChainId] = useState("demo-chain-123");
  const [eventData, setEventData] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

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
      // Mock event creation (we'll replace with actual EQTY Core)
      const newEvent: Event = {
        id: `event-${Date.now()}`,
        data: JSON.parse(eventData),
        timestamp: Date.now(),
      };

      // Mock signing (we'll replace with actual signing)
      const messageToSign = JSON.stringify(newEvent.data);
      const signature = await wallet.signMessage(messageToSign);
      newEvent.signature = signature;

      setEvents((prev) => [...prev, newEvent]);
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
    setEvents([]);
    setMessage("Events cleared");
  };

  const getAnchorMap = () => {
    if (events.length === 0) {
      setMessage("No events to anchor");
      return;
    }

    // Mock anchor map (we'll replace with actual EQTY Core)
    const mockAnchor = {
      key: `stateHash-${chainId}`,
      value: `lastEventHash-${events[events.length - 1].id}`,
    };

    setMessage(`Anchor Map: ${JSON.stringify(mockAnchor, null, 2)}`);
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
            <h3>Events ({events.length})</h3>
            {events.length === 0 ? (
              <p>No events yet. Add some events to see them here.</p>
            ) : (
              <div className="events-container">
                {events.map((event, index) => (
                  <div key={event.id} className="event-item">
                    <div className="event-header">
                      <span className="event-number">#{index + 1}</span>
                      <span className="event-timestamp">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="event-data">
                      <strong>Data:</strong>
                      <pre>{JSON.stringify(event.data, null, 2)}</pre>
                    </div>
                    {event.signature && (
                      <div className="event-signature">
                        <strong>Signature:</strong>
                        <code>{event.signature.slice(0, 20)}...</code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventChainDemo;
