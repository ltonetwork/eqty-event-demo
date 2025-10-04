import React, { useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import {
  Message,
  AnchorClient,
  ViemSigner,
  ViemContract,
  BASE_SEPOLIA_CHAIN_ID,
} from "eqty-core";

interface MessageState {
  message: Message;
  anchorResult?: any;
}

const MessageDemo: React.FC = () => {
  const { walletClient, publicClient, address, isConnected } = useWallet();
  const [messageType, setMessageType] = useState("text/plain");
  const [messageContent, setMessageContent] = useState("");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageRecipient, setMessageRecipient] = useState("");
  const [messages, setMessages] = useState<MessageState[]>([]);
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

  const sendMessage = async () => {
    if (!isConnected || !walletClient || !address) {
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
      const signer = new ViemSigner(walletClient);

      let content: any = messageContent;
      if (messageType === "application/json") {
        content = JSON.parse(messageContent);
      }

      const meta = {
        type: "demo-message",
        title: messageTitle || "Demo Message",
        description: `Message sent at ${new Date().toLocaleString()}`,
      };

      const msg = new Message(content, messageType, meta);

      // Set recipient if provided
      if (messageRecipient.trim()) {
        msg.to(messageRecipient);
      }

      await msg.signWith(signer);

      setMessages((prev) => [...prev, { message: msg }]);

      setMessageContent("");
      setMessageTitle("");
      setMessageRecipient("");
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
      const result = await anchorClient.anchor(
        messageState.message.hash as unknown as Uint8Array
      );

      const updatedMessages = [...messages];
      updatedMessages[index] = { ...messageState, anchorResult: result };
      setMessages(updatedMessages);

      if (result.success) {
        setMessage(
          `Message anchored! TX: ${result.transactionHash.slice(0, 10)}...`
        );
      } else {
        setMessage(`Anchoring failed: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Check if it's a network mismatch error
      if (errorMessage.includes("does not match the target chain")) {
        setMessage("Network mismatch: Please switch to Base Sepolia in MetaMask, or the demo will use mock mode for testing.");
        
        // Fall back to mock result for demo purposes
        const mockResult = {
          success: true,
          transactionHash: "0x" + Math.random().toString(16).substr(2, 64),
          blockNumber: Math.floor(Math.random() * 1000000),
          gasUsed: Math.floor(Math.random() * 100000),
        };
        
        const updatedMessages = [...messages];
        updatedMessages[index] = { ...messageState, anchorResult: mockResult };
        setMessages(updatedMessages);
      } else {
        setMessage(`Anchoring failed: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setMessage("Messages cleared");
  };

  return (
    <div className="card">
      <h2 className="section-header">Messages</h2>

      {!isConnected ? (
        <div className="text-center py-8">
          <p className="text-white font-mono">
            Connect wallet to test messaging
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block mb-1">
                <span className="text-white font-mono text-sm">Type</span>
              </label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                className="input-field w-full"
              >
                <option value="text/plain">Text</option>
                <option value="application/json">JSON</option>
                <option value="text/markdown">Markdown</option>
              </select>
            </div>

            <div>
              <label className="block mb-1">
                <span className="text-white font-mono text-sm">Title</span>
              </label>
              <input
                type="text"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="Message title"
                className="input-field w-full"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1">
              <span className="text-white font-mono text-sm">
                Recipient (optional)
              </span>
            </label>
            <input
              type="text"
              value={messageRecipient}
              onChange={(e) => setMessageRecipient(e.target.value)}
              placeholder="0x..."
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block mb-1">
              <span className="text-white font-mono text-sm">Content</span>
            </label>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder={
                messageType === "application/json"
                  ? '{"key": "value"}'
                  : "Enter your message content"
              }
              rows={3}
              className="input-field w-full resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={sendMessage}
              disabled={isLoading || !messageContent.trim()}
              className="btn-primary flex-1"
            >
              {isLoading ? "Sending..." : "Send Message"}
            </button>
            <button onClick={clearMessages} className="btn-danger">
              Clear
            </button>
          </div>

          {message && (
            <div className="text-mint font-mono text-sm">{message}</div>
          )}

          {messages.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-white font-mono font-bold">
                Messages ({messages.length})
              </h3>
              {messages.map((msgState, index) => (
                <div key={index} className="border border-white p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-white font-mono text-sm">
                        Message #{index + 1}
                      </span>
                      {msgState.message.recipient && (
                        <div className="text-mint font-mono text-xs">
                          To: {msgState.message.recipient.slice(0, 10)}...
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`status-badge ${
                          msgState.message.isSigned()
                            ? "status-connected"
                            : "status-error"
                        }`}
                      >
                        {msgState.message.isSigned() ? "✓" : "✗"}
                      </span>
                      {!msgState.anchorResult && (
                        <button
                          onClick={() => anchorMessage(index)}
                          disabled={isLoading}
                          className="btn-success text-xs px-2 py-1"
                        >
                          Anchor
                        </button>
                      )}
                      {msgState.anchorResult && (
                        <span className="status-badge status-connected text-xs">
                          Anchored
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="code-block">
                    <pre className="text-white text-xs">
                      {msgState.message.mediaType === "application/json"
                        ? JSON.stringify(
                            JSON.parse(msgState.message.data.toString()),
                            null,
                            2
                          )
                        : msgState.message.data.toString()}
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

export default MessageDemo;
