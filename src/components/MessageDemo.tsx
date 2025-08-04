import React, { useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import "./MessageDemo.css";

// Mock EQTY Core types for demo (we'll replace these with actual imports later)
interface Message {
  id: string;
  content: string;
  type: string;
  timestamp: number;
  sender: string;
  signature?: string;
  hash?: string;
}

const MessageDemo: React.FC = () => {
  const { wallet, address, isConnected } = useWallet();
  const [messageContent, setMessageContent] = useState("");
  const [messageType, setMessageType] = useState("text/plain");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const sendMessage = async () => {
    if (!isConnected || !wallet || !address) {
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
      // Mock message creation (we'll replace with actual EQTY Core)
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        content: messageContent,
        type: messageType,
        timestamp: Date.now(),
        sender: address,
      };

      // Mock signing (we'll replace with actual signing)
      const messageToSign = `${newMessage.content}${newMessage.timestamp}`;
      const signature = await wallet.signMessage(messageToSign);
      newMessage.signature = signature;

      // Mock hash generation (we'll replace with actual EQTY Core)
      newMessage.hash = `hash-${Date.now()}`;

      setMessages((prev) => [...prev, newMessage]);
      setMessageContent("");
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

  const clearMessages = () => {
    setMessages([]);
    setMessage("Messages cleared");
  };

  const anchorMessage = (messageHash: string) => {
    // Mock anchoring (we'll replace with actual EQTY Core)
    setMessage(
      `Mock: Anchoring message hash ${messageHash} to blockchain with value 0x0`
    );
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
                Message Content:
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={3}
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
                {messages.map((msg, index) => (
                  <div key={msg.id} className="message-item">
                    <div className="message-header">
                      <span className="message-number">#{index + 1}</span>
                      <span className="message-timestamp">
                        {new Date(msg.timestamp).toLocaleString()}
                      </span>
                      <span className="message-type">{msg.type}</span>
                    </div>

                    <div className="message-sender">
                      <strong>From:</strong> {msg.sender.slice(0, 6)}...
                      {msg.sender.slice(-4)}
                    </div>

                    <div className="message-content">
                      <strong>Content:</strong>
                      <pre>{msg.content}</pre>
                    </div>

                    {msg.signature && (
                      <div className="message-signature">
                        <strong>Signature:</strong>
                        <code>{msg.signature.slice(0, 20)}...</code>
                      </div>
                    )}

                    {msg.hash && (
                      <div className="message-hash">
                        <strong>Hash:</strong>
                        <code>{msg.hash}</code>
                        <button
                          onClick={() => anchorMessage(msg.hash!)}
                          className="anchor-button"
                        >
                          Anchor
                        </button>
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
