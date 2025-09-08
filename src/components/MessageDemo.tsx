import React, { useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import {
  Message,
  EthereumAccount,
  AnchorClient,
  AnchorResult,
} from "eqty-core";
import "./MessageDemo.css";

interface MessageState {
  message: Message;
  anchorResult?: AnchorResult;
}

const MessageDemo: React.FC = () => {
  const { wallet, isConnected } = useWallet();
  const [messageType, setMessageType] = useState("text/plain");
  const [messageContent, setMessageContent] = useState("");
  const [messageTitle, setMessageTitle] = useState("");
  const [messages, setMessages] = useState<MessageState[]>([]);
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

  const sendMessage = async () => {
    if (!isConnected || !wallet) {
      setMessage("Please connect your wallet first");
      return;
    }

    if (!messageContent.trim()) {
      setMessage("Please enter message content");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      // Create Ethereum account from connected wallet
      const account = EthereumAccount.fromSigner(wallet);

      // Parse content based on type
      let content: any = messageContent;
      if (messageType === "application/json") {
        content = JSON.parse(messageContent);
      }

      // Create message with metadata
      const meta = {
        type: "demo-message",
        title: messageTitle || "Demo Message",
        description: `Message sent at ${new Date().toLocaleString()}`,
      };

      const msg = new Message(content, messageType, meta);
      await msg.signWith(account);

      // Add to messages
      setMessages((prev) => [...prev, { message: msg }]);

      setMessageContent("");
      setMessageTitle("");
      setMessage("Message sent and signed successfully!");
    } catch (error) {
      setMessage(
        `Error: ${
          error instanceof Error ? error.message : "Failed to send message"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const anchorMessage = async (index: number) => {
    if (!anchorClient) {
      setMessage("Anchor client not ready");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const messageState = messages[index];
      const result = await anchorClient.anchorMessage(
        messageState.message.hash
      );

      // Update message state with anchor result
      const updatedMessages = [...messages];
      updatedMessages[index] = { ...messageState, anchorResult: result };
      setMessages(updatedMessages);

      if (result.success) {
        setMessage(
          `Message anchored successfully! Transaction: ${result.transactionHash}`
        );
      } else {
        setMessage(`Anchoring failed: ${result.error}`);
      }
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

  const clearMessages = () => {
    setMessages([]);
    setMessage("Messages cleared");
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
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Message Demo</h2>
          <p className="text-gray-600">
            Create, sign, and anchor messages to the blockchain
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
            Please connect your wallet to test messaging
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Message Input Form */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block">
                  <span className="text-white font-medium mb-2 block">
                    Message Type
                  </span>
                  <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value)}
                    className="input-field"
                  >
                    <option value="text/plain">Text</option>
                    <option value="application/json">JSON</option>
                    <option value="text/markdown">Markdown</option>
                  </select>
                </label>
              </div>

              <div>
                <label className="block">
                  <span className="text-white font-medium mb-2 block">
                    Message Title
                  </span>
                  <input
                    type="text"
                    value={messageTitle}
                    onChange={(e) => setMessageTitle(e.target.value)}
                    placeholder="Enter message title"
                    className="input-field"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block">
                <span className="text-white font-medium mb-2 block">
                  Message Content
                </span>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder={
                    messageType === "application/json"
                      ? '{"key": "value"}'
                      : "Enter your message content"
                  }
                  rows={4}
                  className="input-field resize-none"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={sendMessage}
                disabled={isLoading || !messageContent.trim()}
                className="btn-primary"
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
                    Sending...
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
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Send Message
                  </div>
                )}
              </button>

              <button onClick={clearMessages} className="btn-secondary">
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
                Clear Messages
              </button>
            </div>
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

          {/* Messages List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Messages</h3>
              <span className="status-badge bg-primary-500/20 text-primary-300 border border-primary-500/30">
                {messages.length} messages
              </span>
            </div>

            {messages.length === 0 ? (
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
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-white/60">
                  No messages yet. Send some messages to see them here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msgState, index) => (
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
                            Message #{index + 1}
                          </p>
                          <p className="text-white/60 text-sm">
                            {new Date(
                              msgState.message.timestamp || 0
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`status-badge ${
                          msgState.message.verifySignature()
                            ? "status-connected"
                            : "status-error"
                        }`}
                      >
                        {msgState.message.verifySignature() ? (
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-white/80 font-medium mb-2">
                            Message Details
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-white/60">Type:</span>
                              <span className="text-white">
                                {msgState.message.meta.type}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Title:</span>
                              <span className="text-white">
                                {msgState.message.meta.title}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Media Type:</span>
                              <span className="text-white">
                                {msgState.message.mediaType}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-white/80 font-medium mb-2">
                            Content
                          </h4>
                          <div className="bg-black/20 rounded-lg p-3">
                            <pre className="text-white/90 text-sm overflow-x-auto">
                              {JSON.stringify(
                                msgState.message.data.toString(),
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-white/80 font-medium mb-1">
                            Hash
                          </h4>
                          <code className="text-primary-300 text-sm bg-black/20 px-2 py-1 rounded break-all">
                            {msgState.message.hash.hex}
                          </code>
                        </div>

                        <div>
                          <h4 className="text-white/80 font-medium mb-1">
                            Signature
                          </h4>
                          <code className="text-primary-300 text-sm bg-black/20 px-2 py-1 rounded">
                            {msgState.message.signature?.hex.slice(0, 20)}...
                          </code>
                        </div>

                        <div className="pt-4">
                          <button
                            onClick={() => anchorMessage(index)}
                            disabled={isLoading || !!msgState.anchorResult}
                            className={`w-full ${
                              msgState.anchorResult
                                ? "btn-secondary"
                                : "btn-primary"
                            }`}
                          >
                            {msgState.anchorResult ? (
                              <div className="flex items-center">
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
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Anchored
                              </div>
                            ) : (
                              <div className="flex items-center">
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
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Anchor Result */}
                    {msgState.anchorResult && (
                      <div
                        className={`mt-6 p-4 rounded-xl border ${
                          msgState.anchorResult.success
                            ? "bg-green-500/10 border-green-500/30"
                            : "bg-red-500/10 border-red-500/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-white font-medium">
                            Anchor Result
                          </h4>
                          <span
                            className={`status-badge ${
                              msgState.anchorResult.success
                                ? "status-connected"
                                : "status-error"
                            }`}
                          >
                            {msgState.anchorResult.success
                              ? "✓ Success"
                              : "✗ Failed"}
                          </span>
                        </div>

                        {msgState.anchorResult.success && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h5 className="text-white/80 font-medium mb-1">
                                Transaction
                              </h5>
                              <code className="text-green-300 text-sm bg-black/20 px-2 py-1 rounded break-all">
                                {msgState.anchorResult.transactionHash}
                              </code>
                            </div>
                            <div>
                              <h5 className="text-white/80 font-medium mb-1">
                                Block
                              </h5>
                              <code className="text-green-300 text-sm bg-black/20 px-2 py-1 rounded">
                                {msgState.anchorResult.blockNumber}
                              </code>
                            </div>
                            <div>
                              <h5 className="text-white/80 font-medium mb-1">
                                Gas Used
                              </h5>
                              <code className="text-green-300 text-sm bg-black/20 px-2 py-1 rounded">
                                {msgState.anchorResult.gasUsed?.toString()}
                              </code>
                            </div>
                          </div>
                        )}

                        {!msgState.anchorResult.success && (
                          <div>
                            <h5 className="text-white/80 font-medium mb-1">
                              Error
                            </h5>
                            <code className="text-red-300 text-sm bg-black/20 px-2 py-1 rounded">
                              {msgState.anchorResult.error}
                            </code>
                          </div>
                        )}
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

export default MessageDemo;
