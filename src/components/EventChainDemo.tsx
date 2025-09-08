import React, { useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import {
  Event,
  EventChain,
  EthereumAccount,
  AnchorClient,
  AnchorResult,
} from "eqty-core";
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
      // Create Ethereum account from connected wallet
      const account = EthereumAccount.fromSigner(wallet);

      // Create or get existing chain
      let currentChain = chainState?.chain || new EventChain(chainId);

      // Create and sign event
      const event = new Event(JSON.parse(eventData), "application/json");
      await event.signWith(account);

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
    setMessage(
      `Anchor Map: ${JSON.stringify(
        anchorMap.map((a) => ({
          key: a.key.hex,
          value: a.value.hex,
        })),
        null,
        2
      )}`
    );
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
      const failedResults = results.filter((r: AnchorResult) => !r.success);
      if (failedResults.length > 0) {
        setMessage(
          `Some anchors failed: ${failedResults
            .map((r: AnchorResult) => r.error)
            .join(", ")}`
        );
      } else {
        setMessage(
          `Successfully anchored ${results.length} items to blockchain!`
        );
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
    <div className="card p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
          <svg
            className="w-5 h-5 text-blue-600"
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
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Event Chain Demo
          </h2>
          <p className="text-gray-600">
            Create, sign, and anchor events to the blockchain
          </p>
        </div>
      </div>

      {!isConnected ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-white/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <p className="text-white/80 text-lg">
            Please connect your wallet to test event chains
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Chain Configuration */}
          <div className="space-y-4">
            <label className="block">
              <span className="text-white font-medium mb-2 block">
                Chain ID
              </span>
              <input
                type="text"
                value={chainId}
                onChange={(e) => setChainId(e.target.value)}
                placeholder="Enter chain ID"
                className="input-field"
              />
            </label>
          </div>

          {/* Event Input */}
          <div className="space-y-4">
            <label className="block">
              <span className="text-white font-medium mb-2 block">
                Event Data (JSON)
              </span>
              <textarea
                value={eventData}
                onChange={(e) => setEventData(e.target.value)}
                placeholder='{"action": "user_login", "timestamp": 1234567890, "userId": "user123"}'
                rows={4}
                className="input-field resize-none"
              />
            </label>
            <button
              onClick={addEvent}
              disabled={isLoading || !eventData.trim()}
              className="btn-primary w-full sm:w-auto"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Adding Event...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add Event
                </div>
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button onClick={getAnchorMap} className="btn-secondary">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Get Anchor Map
            </button>
            <button
              onClick={anchorToBlockchain}
              className="btn-primary"
              disabled={
                !chainState || chainState.events.length === 0 || !anchorClient
              }
            >
              <svg
                className="w-4 h-4 mr-2"
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
              Anchor to Blockchain
            </button>
            <button onClick={clearEvents} className="btn-secondary">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Clear Events
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className="p-4 bg-white/5 border border-white/20 rounded-xl">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-primary-400 mr-3 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-white/90">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {message}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Events List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Events</h3>
              <span className="status-badge bg-primary-500/20 text-primary-300 border border-primary-500/30">
                {chainState?.events.length || 0} events
              </span>
            </div>

            {!chainState || chainState.events.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <p className="text-white/60">
                  No events yet. Add some events to see them here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {chainState.events.map((event, index) => (
                  <div
                    key={index}
                    className="bg-white/5 border border-white/10 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-primary-300 font-bold text-sm">
                            #{index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            Event #{index + 1}
                          </p>
                          <p className="text-white/60 text-sm">
                            {new Date(event.timestamp || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`status-badge ${
                          event.verifySignature()
                            ? "status-connected"
                            : "status-error"
                        }`}
                      >
                        {event.verifySignature() ? (
                          <>
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Valid
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Invalid
                          </>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-white/80 font-medium mb-2">
                          Event Data
                        </h4>
                        <div className="bg-black/20 rounded-lg p-3">
                          <pre className="text-white/90 text-sm overflow-x-auto">
                            {JSON.stringify(event.parsedData, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="text-white/80 font-medium mb-1">
                            Hash
                          </h4>
                          <code className="text-primary-300 text-sm bg-black/20 px-2 py-1 rounded">
                            {event.hash.hex}
                          </code>
                        </div>

                        <div>
                          <h4 className="text-white/80 font-medium mb-1">
                            Signature
                          </h4>
                          <code className="text-primary-300 text-sm bg-black/20 px-2 py-1 rounded">
                            {event.signature?.hex.slice(0, 20)}...
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anchor Results */}
          {chainState?.anchorResults && chainState.anchorResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Anchor Results</h3>
                <span className="status-badge bg-primary-500/20 text-primary-300 border border-primary-500/30">
                  {chainState.anchorResults.length} results
                </span>
              </div>

              <div className="space-y-4">
                {chainState.anchorResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-xl border ${
                      result.success
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                            result.success ? "bg-green-500/20" : "bg-red-500/20"
                          }`}
                        >
                          <span
                            className={`font-bold text-sm ${
                              result.success ? "text-green-300" : "text-red-300"
                            }`}
                          >
                            #{index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            Anchor Result #{index + 1}
                          </p>
                          <p
                            className={`text-sm ${
                              result.success ? "text-green-300" : "text-red-300"
                            }`}
                          >
                            {result.success
                              ? "Successfully anchored"
                              : "Anchoring failed"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`status-badge ${
                          result.success ? "status-connected" : "status-error"
                        }`}
                      >
                        {result.success ? "✓ Success" : "✗ Failed"}
                      </span>
                    </div>

                    {result.success && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-white/80 font-medium mb-1">
                            Transaction
                          </h4>
                          <code className="text-green-300 text-sm bg-black/20 px-2 py-1 rounded break-all">
                            {result.transactionHash}
                          </code>
                        </div>
                        <div>
                          <h4 className="text-white/80 font-medium mb-1">
                            Block
                          </h4>
                          <code className="text-green-300 text-sm bg-black/20 px-2 py-1 rounded">
                            {result.blockNumber}
                          </code>
                        </div>
                        <div>
                          <h4 className="text-white/80 font-medium mb-1">
                            Gas Used
                          </h4>
                          <code className="text-green-300 text-sm bg-black/20 px-2 py-1 rounded">
                            {result.gasUsed?.toString()}
                          </code>
                        </div>
                      </div>
                    )}

                    {!result.success && (
                      <div>
                        <h4 className="text-white/80 font-medium mb-1">
                          Error
                        </h4>
                        <code className="text-red-300 text-sm bg-black/20 px-2 py-1 rounded">
                          {result.error}
                        </code>
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
