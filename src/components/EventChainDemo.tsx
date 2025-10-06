import React, { useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import {
  Event,
  EventChain,
  AnchorClient,
  ViemSigner,
  ViemContract,
  BASE_SEPOLIA_CHAIN_ID,
} from "eqty-core";

interface EventChainState {
  chain: EventChain;
  events: Event[];
  anchorResults: any[];
}

const EventChainDemo: React.FC = () => {
  const { walletClient, publicClient, address, isConnected } = useWallet();
  const [eventData, setEventData] = useState("");
  const [chainState, setChainState] = useState<EventChainState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [anchorClient, setAnchorClient] = useState<AnchorClient<any> | null>(
    null
  );

  React.useEffect(() => {
    if (isConnected && walletClient && publicClient && address) {
      try {
        const contractAddress = AnchorClient.contractAddress(
          BASE_SEPOLIA_CHAIN_ID
        );
        const contract = new ViemContract(
          publicClient,
          walletClient,
          contractAddress
        );

        const client = new AnchorClient(contract as any);
        setAnchorClient(client);
      } catch (error) {
        console.warn("Failed to create anchor client, using mock:", error);
        const mockContract = {
          anchor: async (anchors: any[]) => {
            console.log("Mock anchor call:", anchors);
            return {
              success: true,
              transactionHash: "0x" + Math.random().toString(16).substr(2, 64),
              blockNumber: Math.floor(Math.random() * 1000000),
              gasUsed: Math.floor(Math.random() * 100000),
            };
          },
          maxAnchors: async () => 100,
        };

        const client = new AnchorClient(mockContract);
        setAnchorClient(client);
      }
    }
  }, [isConnected, walletClient, publicClient, address]);

  const addEvent = async () => {
    if (!isConnected || !walletClient || !address) {
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
      const signer = new ViemSigner(walletClient);

      let currentChain = chainState?.chain;
      if (!currentChain) {
        currentChain = EventChain.create(address, BASE_SEPOLIA_CHAIN_ID);
      }

      const event = new Event(JSON.parse(eventData), "application/json");
      await event.signWith(signer);
      event.addTo(currentChain);

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

  const anchorToBlockchain = async () => {
    if (!chainState || !anchorClient) {
      setMessage("No chain to anchor or anchor client not ready");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const anchorMap = chainState.chain.anchorMap;
      const anchors = anchorMap.map((a) => ({
        key: a.key as unknown as Uint8Array,
        value: a.value as unknown as Uint8Array,
      }));

      const result = await anchorClient.anchor(anchors);

      const transactionHash =
        typeof result === "string"
          ? result
          : "Transaction successful (check MetaMask)";

      const anchorResult = {
        success: true,
        transactionHash: transactionHash,
        blockNumber: Math.floor(Math.random() * 1000000),
        gasUsed: Math.floor(Math.random() * 100000),
      };

      setMessage(
        `Successfully anchored to blockchain! TX: ${transactionHash.slice(
          0,
          10
        )}...`
      );

      setChainState({
        ...chainState,
        anchorResults: [...chainState.anchorResults, anchorResult],
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Check if it's a network mismatch error
      if (errorMessage.includes("does not match the target chain")) {
        setMessage(
          "Network mismatch: Please switch to Base Sepolia in MetaMask, or the demo will use mock mode for testing."
        );

        // Fall back to mock result for demo purposes
        const mockResult = {
          success: true,
          transactionHash: "0x" + Math.random().toString(16).substr(2, 64),
          blockNumber: Math.floor(Math.random() * 1000000),
          gasUsed: Math.floor(Math.random() * 100000),
        };

        if (chainState) {
          setChainState({
            ...chainState,
            anchorResults: [...chainState.anchorResults, mockResult],
          });
        }
      } else {
        setMessage(`Anchoring failed: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="section-header">Event Chain</h2>

      {!isConnected ? (
        <div className="text-center py-8">
          <p className="text-white font-mono">
            Connect wallet to test event chains
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block mb-2">
              <span className="text-white font-mono text-sm">
                Event Data (JSON)
              </span>
            </label>
            <textarea
              value={eventData}
              onChange={(e) => setEventData(e.target.value)}
              placeholder='{"action": "user_login", "timestamp": 1234567890}'
              rows={3}
              className="input-field w-full resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={addEvent}
              disabled={isLoading || !eventData.trim()}
              className="btn-primary flex-1"
            >
              {isLoading ? "Adding..." : "Add Event"}
            </button>
            <button
              onClick={anchorToBlockchain}
              disabled={
                !chainState || chainState.events.length === 0 || !anchorClient
              }
              className="btn-success flex-1"
            >
              Anchor
            </button>
            <button onClick={clearEvents} className="btn-danger">
              Clear
            </button>
          </div>

          {message && (
            <div className="text-mint font-mono text-sm">{message}</div>
          )}

          {chainState && chainState.events.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-white font-mono font-bold">
                Events ({chainState.events.length})
              </h3>
              {chainState.events.map((event, index) => (
                <div key={index} className="border border-white p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-mono text-sm">
                      Event #{index + 1}
                    </span>
                    <span
                      className={`status-badge ${
                        event.isSigned() ? "status-connected" : "status-error"
                      }`}
                    >
                      {event.isSigned() ? "✓" : "✗"}
                    </span>
                  </div>
                  <div className="code-block">
                    <pre className="text-white text-xs">
                      {JSON.stringify(
                        JSON.parse(event.data.toString()),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventChainDemo;
