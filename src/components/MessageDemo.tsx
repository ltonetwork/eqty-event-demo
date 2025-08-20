import React, { useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import { Message, EthersSigner, AnchorClient, AnchorResult } from "@eqty-core/events";
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
      // Create EQTY signer
      const eqtySigner = new EthersSigner(wallet);

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
      await msg.signWith(eqtySigner);

      // Add to messages
      setMessages(prev => [...prev, { message: msg }]);

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
      const result = await anchorClient.anchorMessage(messageState.message.hash);

      // Update message state with anchor result
      const updatedMessages = [...messages];
      updatedMessages[index] = { ...messageState, anchorResult: result };
      setMessages(updatedMessages);

      if (result.success) {
        setMessage(`Message anchored successfully! Transaction: ${result.transactionHash}`);
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
    <div className="message-demo">
      <h2>Message Demo</h2>

      {!isConnected ? (
        <div className="not-connected">
          <p>Please connect your wallet to test messaging</p>
        </div>
      ) : (
        <div className="demo-content">
          <div className="message-input">
            <div className="input-group">
              <label>
                Message Type:
                <select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                >
                  <option value="text/plain">Text</option>
                  <option value="application/json">JSON</option>
                  <option value="text/markdown">Markdown</option>
                </select>
              </label>
            </div>

            <div className="input-group">
              <label>
                Message Title:
                <input
                  type="text"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="Enter message title"
                />
              </label>
            </div>

            <div className="input-group">
              <label>
                Message Content:
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder={
                    messageType === "application/json"
                      ? '{"key": "value"}'
                      : "Enter your message content"
                  }
                  rows={4}
                />
              </label>
            </div>

            <button
              onClick={sendMessage}
              disabled={isLoading || !messageContent.trim()}
              className="send-button"
            >
              {isLoading ? "Sending..." : "Send Message"}
            </button>
          </div>

          <div className="actions">
            <button onClick={clearMessages} className="clear-button">
              Clear Messages
            </button>
          </div>

          {message && (
            <div className="message">
              <pre>{message}</pre>
            </div>
          )}

          <div className="messages-list">
            <h3>Messages ({messages.length})</h3>
            {messages.length === 0 ? (
              <p>No messages yet. Send some messages to see them here.</p>
            ) : (
              <div className="messages-container">
                {messages.map((msgState, index) => (
                  <div key={index} className="message-item">
                    <div className="message-header">
                      <span className="message-number">#{index + 1}</span>
                      <span className="message-timestamp">
                        {new Date(msgState.message.timestamp || 0).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="message-meta">
                      <div><strong>Type:</strong> {msgState.message.meta.type}</div>
                      <div><strong>Title:</strong> {msgState.message.meta.title}</div>
                      <div><strong>Media Type:</strong> {msgState.message.mediaType}</div>
                    </div>

                    <div className="message-content">
                      <strong>Content:</strong>
                      <pre>{JSON.stringify(msgState.message.data.toString(), null, 2)}</pre>
                    </div>

                    <div className="message-hash">
                      <strong>Hash:</strong>
                      <code>{msgState.message.hash.hex}</code>
                    </div>

                    <div className="message-signature">
                      <strong>Signature:</strong>
                      <code>{msgState.message.signature?.hex.slice(0, 20)}...</code>
                    </div>

                    <div className="message-verification">
                      <strong>Verified:</strong>
                      <span className={msgState.message.verifySignature() ? "verified" : "not-verified"}>
                        {msgState.message.verifySignature() ? "✓ Valid" : "✗ Invalid"}
                      </span>
                    </div>

                    <div className="message-actions">
                      <button
                        onClick={() => anchorMessage(index)}
                        disabled={isLoading || !!msgState.anchorResult}
                        className="anchor-button"
                      >
                        {msgState.anchorResult ? "Anchored" : "Anchor to Blockchain"}
                      </button>
                    </div>

                    {msgState.anchorResult && (
                      <div className={`anchor-result ${msgState.anchorResult.success ? 'success' : 'error'}`}>
                        <div className="result-header">
                          <strong>Anchor Result:</strong>
                          <span className="result-status">
                            {msgState.anchorResult.success ? "✓ Success" : "✗ Failed"}
                          </span>
                        </div>
                        {msgState.anchorResult.success && (
                          <div className="result-details">
                            <div><strong>Transaction:</strong> {msgState.anchorResult.transactionHash}</div>
                            <div><strong>Block:</strong> {msgState.anchorResult.blockNumber}</div>
                            <div><strong>Gas Used:</strong> {msgState.anchorResult.gasUsed?.toString()}</div>
                          </div>
                        )}
                        {!msgState.anchorResult.success && (
                          <div className="result-error">
                            <strong>Error:</strong> {msgState.anchorResult.error}
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
