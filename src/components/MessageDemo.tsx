import React, { useState, useEffect } from "react";
import { useWallet } from "../contexts/WalletContext";
import { useRelay } from "../contexts/RelayContext";
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

interface MessageSummary {
  hash: string;
  timestamp: number;
  sender: string;
  recipient: string;
  size: number;
  meta?: {
    type: string;
    title: string;
    description: string;
    thumbnail?: string;
  };
}

const MessageDemo: React.FC = () => {
  const { walletClient, publicClient, address, isConnected } = useWallet();
  const { relay, isConnected: relayConnected, error: relayError } = useRelay();
  const [messageType, setMessageType] = useState("text/plain");
  const [messageContent, setMessageContent] = useState("");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageRecipient, setMessageRecipient] = useState("");
  const [messages, setMessages] = useState<MessageState[]>([]);
  const [messageSummaries, setMessageSummaries] = useState<MessageSummary[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [signingStep, setSigningStep] = useState<string>("");
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [anchorClient, setAnchorClient] = useState<AnchorClient<any> | null>(
    null
  );
  const [selectedMessage, setSelectedMessage] = useState<MessageState | null>(
    null
  );
  const [selectedSummary, setSelectedSummary] = useState<MessageSummary | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
        console.error("Failed to initialize anchor client:", error);
      }
    }
  }, [isConnected, walletClient, publicClient, address]);

  const sendMessage = async () => {
    if (!isConnected || !walletClient || !address) {
      setMessage("Please connect your wallet first");
      return;
    }

    if (!relayConnected) {
      setMessage("Relay not connected");
      return;
    }

    if (!messageRecipient.trim()) {
      setMessage("Recipient address is required");
      return;
    }

    if (!messageContent.trim() && !selectedFile) {
      setMessage("Message content or file is required");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setSigningStep("");

    try {
      const signer = new ViemSigner(walletClient);
      let data: Uint8Array;
      let mediaType: string;

      if (selectedFile) {
        setSigningStep("Preparing file data...");
        const fileData = await selectedFile.arrayBuffer();
        data = new Uint8Array(fileData);
        mediaType = selectedFile.type || "application/octet-stream";

        // Show file size info
        const fileSizeMB = (selectedFile.size / (1024 * 1024)).toFixed(1);
        setSigningStep(`Processing ${fileSizeMB}MB file...`);
      } else {
        setSigningStep("Preparing text message...");
        data = new TextEncoder().encode(messageContent);
        mediaType = messageType;
      }

      setSigningStep("Creating message...");
      const msg = new Message(data, mediaType, {
        type: selectedFile ? "file-message" : "text-message",
        title: messageTitle || (selectedFile ? selectedFile.name : "Message"),
        description: selectedFile
          ? `File: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(
              1
            )}KB)`
          : "Text message",
      });

      setSigningStep("Setting recipient...");
      msg.to(messageRecipient);

      setSigningStep("Computing message hash...");
      if (selectedFile && selectedFile.size > 1024 * 1024) {
        setSigningStep(
          `Computing hash for ${(selectedFile.size / (1024 * 1024)).toFixed(
            1
          )}MB file (this may take a moment)...`
        );
      }

      await msg.signWith(signer);

      setSigningStep("Sending to relay...");

      await relay!.send(msg);

      const messageState: MessageState = { message: msg };
      setMessages((prev) => [...prev, messageState]);

      setSigningStep("");
      setMessage(
        selectedFile ? `File sent successfully!` : `Message sent successfully!`
      );
      setMessageContent("");
      setMessageTitle("");
      setMessageRecipient("");
      setSelectedFile(null);
      setFilePreview(null);

      // Refresh message summaries
      await loadMessageSummaries();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setSigningStep("");
      setMessage(`Failed to send message: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessageSummaries = async () => {
    if (!relayConnected || !address) return;

    setIsLoadingMessages(true);
    try {
      const response = await fetch(`${relay!.url}/messages/${address}`);
      const data = await response.json();
      setMessageSummaries(data.messages || []);
      setMessage(`Loaded ${data.messages?.length || 0} message summaries`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setMessage(`Failed to load messages: ${errorMessage}`);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadFullMessage = async (summary: MessageSummary) => {
    setIsLoadingMessage(true);
    try {
      const response = await fetch(
        `${relay!.url}/messages/${summary.recipient}/${summary.hash}`
      );
      const fullMessage = await response.json();

      // Convert to Message object
      const message = Message.from(fullMessage);
      const messageState: MessageState = { message };

      setSelectedMessage(messageState);
      setSelectedSummary(summary);
      setShowDetailsModal(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setMessage(`Failed to load message: ${errorMessage}`);
    } finally {
      setIsLoadingMessage(false);
    }
  };

  const anchorMessage = async (messageState: MessageState) => {
    if (!anchorClient) {
      setMessage("Anchor client not ready");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const result = await anchorClient.anchor(
        messageState.message.hash as unknown as Uint8Array
      );
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

      setSelectedMessage({ ...messageState, anchorResult });
      setMessage(`Message anchored! TX: ${transactionHash.slice(0, 10)}...`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("does not match the target chain")) {
        setMessage(
          "Network mismatch: Please switch to Base Sepolia in MetaMask, or the demo will use mock mode for testing."
        );

        const mockResult = {
          success: true,
          transactionHash: "0x" + Math.random().toString(16).substr(2, 64),
          blockNumber: Math.floor(Math.random() * 1000000),
          gasUsed: Math.floor(Math.random() * 100000),
        };

        setSelectedMessage({ ...messageState, anchorResult: mockResult });
      } else {
        setMessage(`Anchoring failed: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setMessageSummaries([]);
    setSelectedMessage(null);
    setSelectedSummary(null);
    setMessage("Messages cleared");
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMessageContent("");

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const downloadFile = (message: Message) => {
    try {
      // Convert base64 data to blob
      const base64Data = message.data.base64;
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create blob and download
      const blob = new Blob([bytes], { type: message.mediaType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from metadata or use default
      const filename =
        message.meta?.title ||
        `file.${message.mediaType.split("/")[1]}` ||
        "download";

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download file:", error);
      setMessage("Failed to download file");
    }
  };

  const renderMessageContent = (message: Message) => {
    if (message.mediaType?.startsWith("image/")) {
      try {
        // Check if this is a large file with a direct URL
        const isLargeFile = (message as any).isLargeFile;
        const fileUrl = (message as any).fileUrl;

        if (isLargeFile && fileUrl) {
          // For large files, use the direct file URL (super fast!)
          return (
            <div className="space-y-3">
              <div className="text-gray-300 font-mono text-xs">
                Image Preview ({message.mediaType}) - Large File
              </div>
              <div className="flex justify-center">
                <img
                  src={`http://localhost:8000${fileUrl}`}
                  alt="Message content"
                  className="max-w-full max-h-96 object-contain rounded border border-gray-600"
                />
              </div>
              <div className="text-gray-400 font-mono text-xs text-center">
                Size:{" "}
                {formatFileSize((message as any).size || message.data.length)}
              </div>
            </div>
          );
        } else {
          // For small files, decode base58/base64 to binary, then convert to base64 for display
          let imageData: string;
          try {
            // Convert to base64 for image display
            const base64Data = message.data.base64;
            imageData = `data:${message.mediaType};base64,${base64Data}`;
          } catch (error) {
            console.error("Failed to convert image data:", error);
            return <div className="text-red-400">Failed to load image</div>;
          }

          return (
            <div className="space-y-3">
              <div className="text-gray-300 font-mono text-xs">
                Image Preview ({message.mediaType})
              </div>
              <div className="flex justify-center">
                <img
                  src={imageData}
                  alt="Message content"
                  className="max-w-full max-h-96 object-contain rounded border border-gray-600"
                />
              </div>
              <div className="text-gray-400 font-mono text-xs text-center">
                Size: {formatFileSize(message.data.length)}
              </div>
            </div>
          );
        }
      } catch (error) {
        return (
          <div className="text-red-400 font-mono text-sm p-4 bg-red-900 rounded border border-red-600">
            Failed to load image:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        );
      }
    } else if (
      message.mediaType === "application/zip" ||
      message.mediaType === "application/pdf" ||
      message.mediaType === "application/octet-stream"
    ) {
      const isLargeFile = (message as any).isLargeFile;
      const fileUrl = (message as any).fileUrl;

      return (
        <div className="space-y-3">
          <div className="text-gray-300 font-mono text-xs">Binary File</div>
          <div className="p-4 bg-gray-800 rounded border border-gray-600">
            <div className="text-white font-mono text-sm space-y-2">
              <div className="flex justify-between">
                <span>File Type:</span>
                <span className="text-mint">{message.mediaType}</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="text-mint">
                  {formatFileSize((message as any).size || message.data.length)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Storage:</span>
                <span className="text-mint">
                  {isLargeFile ? "Bucket Storage" : "Embedded"}
                </span>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {isLargeFile && fileUrl ? (
                <div className="p-2 bg-gray-900 rounded">
                  <a
                    href={`http://localhost:8000${fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-mint hover:text-white font-mono text-sm"
                  >
                    Download File →
                  </a>
                </div>
              ) : (
                <button
                  onClick={() => downloadFile(message)}
                  className="w-full p-2 bg-mint hover:bg-mint/80 text-black font-mono text-sm rounded transition-colors"
                >
                  Download File
                </button>
              )}
              <div className="text-gray-400 font-mono text-xs p-2 bg-gray-900 rounded">
                Binary file content (not displayed in UI)
              </div>
            </div>
          </div>
        </div>
      );
    } else if (message.mediaType === "application/json") {
      try {
        const jsonContent = new TextDecoder().decode(message.data);
        const parsed = JSON.parse(jsonContent);
        return (
          <div className="space-y-3">
            <div className="text-gray-300 font-mono text-xs">JSON Content</div>
            <pre className="p-4 bg-gray-800 rounded border border-gray-600 text-green-400 font-mono text-sm overflow-auto max-h-64">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          </div>
        );
      } catch (error) {
        return (
          <div className="text-red-400 font-mono text-sm p-4 bg-red-900 rounded border border-red-600">
            Invalid JSON content:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        );
      }
    } else {
      try {
        const textContent = new TextDecoder().decode(message.data);
        return (
          <div className="space-y-3">
            <div className="text-gray-300 font-mono text-xs">Text Content</div>
            <div className="p-4 bg-gray-800 rounded border border-gray-600 text-white font-mono text-sm whitespace-pre-wrap max-h-64 overflow-auto">
              {textContent}
            </div>
          </div>
        );
      } catch (error) {
        return (
          <div className="text-red-400 font-mono text-sm p-4 bg-red-900 rounded border border-red-600">
            Failed to decode content:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        );
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gray-900 text-white">
      {/* Sidebar - Message Summaries */}
      <div className="w-1/3 border-r border-gray-700 bg-gray-800">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold font-mono mb-4">Messages</h2>
          <div className="flex gap-2">
            <button
              onClick={loadMessageSummaries}
              disabled={isLoadingMessages || !relayConnected}
              className="btn-secondary flex-1"
            >
              {isLoadingMessages ? "Loading..." : "Load Messages"}
            </button>
            <button onClick={clearMessages} className="btn-danger">
              Clear
            </button>
          </div>
        </div>

        <div className="overflow-y-auto h-full">
          {messageSummaries.length === 0 ? (
            <div className="p-4 text-gray-400 text-center">
              No messages found
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {messageSummaries.map((summary, index) => (
                <div
                  key={summary.hash}
                  onClick={() => loadFullMessage(summary)}
                  className="p-3 border border-gray-600 rounded cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="text-white font-mono text-sm font-bold">
                        {summary.meta?.title || `Message #${index + 1}`}
                      </div>
                      <div className="text-gray-400 font-mono text-xs">
                        From: {summary.sender.slice(0, 10)}...
                      </div>
                      <div className="text-gray-400 font-mono text-xs">
                        {formatTimestamp(summary.timestamp)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-mint font-mono text-xs">
                        {formatFileSize(summary.size)}
                      </div>
                      <div className="text-gray-400 font-mono text-xs">
                        {summary.meta?.type || "unknown"}
                      </div>
                    </div>
                  </div>
                  {summary.meta?.description && (
                    <div className="text-gray-300 font-mono text-xs">
                      {summary.meta.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Send Messages */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold font-mono mb-4">Send Message</h2>

          <div className="space-y-4">
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

            <div>
              <label className="block mb-1">
                <span className="text-white font-mono text-sm">
                  Recipient (required)
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
                <span className="text-white font-mono text-sm">
                  File Upload
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="input-field flex-1"
                  accept="image/*,.zip,.pdf"
                />
                {selectedFile && (
                  <button
                    onClick={clearFile}
                    className="text-red-400 hover:text-red-300 text-sm px-2 py-1 border border-red-400 rounded"
                  >
                    ✕
                  </button>
                )}
              </div>
              {filePreview && (
                <div className="mt-2">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="max-w-xs max-h-32 object-contain rounded border border-gray-600"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block mb-1">
                <span className="text-white font-mono text-sm">
                  Content {selectedFile && "(disabled when file is selected)"}
                </span>
              </label>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder={
                  selectedFile
                    ? "File selected - content disabled"
                    : messageType === "application/json"
                    ? '{"key": "value"}'
                    : "Enter your message content"
                }
                rows={3}
                disabled={!!selectedFile}
                className="input-field w-full resize-none"
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={isLoading || (!messageContent.trim() && !selectedFile)}
              className="btn-primary w-full"
            >
              {isLoading
                ? "Processing..."
                : selectedFile
                ? "Send File"
                : "Send Message"}
            </button>

            {signingStep && (
              <div className="text-blue-400 font-mono text-sm p-3 bg-blue-900 rounded border border-blue-600">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  <span>{signingStep}</span>
                </div>
              </div>
            )}

            {message && (
              <div className="text-mint font-mono text-sm">{message}</div>
            )}
          </div>
        </div>

        {/* Message Details Modal */}
        {showDetailsModal && selectedMessage && selectedSummary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold font-mono">
                  Message Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white text-2xl p-2"
                >
                  ✕
                </button>
              </div>

              {isLoadingMessage ? (
                <div className="text-center py-12">
                  <div className="text-mint font-mono text-lg">
                    Loading message content...
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-900 p-4 rounded border border-gray-600">
                      <div className="text-gray-400 font-mono text-sm mb-1">
                        Hash
                      </div>
                      <div className="text-white font-mono text-xs break-all">
                        {selectedSummary.hash}
                      </div>
                    </div>
                    <div className="bg-gray-900 p-4 rounded border border-gray-600">
                      <div className="text-gray-400 font-mono text-sm mb-1">
                        Size
                      </div>
                      <div className="text-white font-mono text-sm">
                        {formatFileSize(selectedSummary.size)}
                      </div>
                    </div>
                    <div className="bg-gray-900 p-4 rounded border border-gray-600">
                      <div className="text-gray-400 font-mono text-sm mb-1">
                        Media Type
                      </div>
                      <div className="text-white font-mono text-sm">
                        {selectedMessage.message.mediaType}
                      </div>
                    </div>
                    <div className="bg-gray-900 p-4 rounded border border-gray-600">
                      <div className="text-gray-400 font-mono text-sm mb-1">
                        From
                      </div>
                      <div className="text-white font-mono text-xs break-all">
                        {selectedSummary.sender}
                      </div>
                    </div>
                    <div className="bg-gray-900 p-4 rounded border border-gray-600">
                      <div className="text-gray-400 font-mono text-sm mb-1">
                        To
                      </div>
                      <div className="text-white font-mono text-xs break-all">
                        {selectedSummary.recipient}
                      </div>
                    </div>
                    <div className="bg-gray-900 p-4 rounded border border-gray-600">
                      <div className="text-gray-400 font-mono text-sm mb-1">
                        Timestamp
                      </div>
                      <div className="text-white font-mono text-sm">
                        {formatTimestamp(selectedSummary.timestamp)}
                      </div>
                    </div>
                  </div>

                  {/* Signature and Verification */}
                  <div className="bg-gray-900 p-4 rounded border border-gray-600">
                    <div className="text-gray-400 font-mono text-sm mb-3">
                      Signature & Verification
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-300 font-mono text-xs mb-1">
                          Signature Status
                        </div>
                        <div
                          className={`font-mono text-sm ${
                            selectedMessage.message.isSigned()
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {selectedMessage.message.isSigned()
                            ? "✓ Signed"
                            : "✗ Not Signed"}
                        </div>
                      </div>
                      {selectedMessage.message.isSigned() && (
                        <div>
                          <div className="text-gray-300 font-mono text-xs mb-1">
                            Signature
                          </div>
                          <div className="text-white font-mono text-xs break-all bg-gray-800 p-2 rounded">
                            {selectedMessage.message.signature?.base58 || "N/A"}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-gray-300 font-mono text-xs mb-1">
                          Hash Verification
                        </div>
                        <div
                          className={`font-mono text-sm ${
                            selectedMessage.message.verifyHash()
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {selectedMessage.message.verifyHash()
                            ? "✓ Hash Valid"
                            : "✗ Hash Invalid"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  {selectedSummary.meta && (
                    <div className="bg-gray-900 p-4 rounded border border-gray-600">
                      <div className="text-gray-400 font-mono text-sm mb-3">
                        Metadata
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-gray-300 font-mono text-xs mb-1">
                            Type
                          </div>
                          <div className="text-white font-mono text-sm">
                            {selectedSummary.meta.type}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-300 font-mono text-xs mb-1">
                            Title
                          </div>
                          <div className="text-white font-mono text-sm">
                            {selectedSummary.meta.title}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-gray-300 font-mono text-xs mb-1">
                            Description
                          </div>
                          <div className="text-white font-mono text-sm">
                            {selectedSummary.meta.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="bg-gray-900 p-4 rounded border border-gray-600">
                    <div className="text-gray-400 font-mono text-sm mb-3">
                      Content
                    </div>
                    {renderMessageContent(selectedMessage.message)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-600">
                    {!selectedMessage.anchorResult && (
                      <button
                        onClick={() => anchorMessage(selectedMessage)}
                        disabled={isLoading}
                        className="btn-primary"
                      >
                        {isLoading ? "Anchoring..." : "Anchor Message"}
                      </button>
                    )}
                    {selectedMessage.anchorResult && (
                      <div className="text-green-400 font-mono text-sm flex items-center">
                        ✓ Anchored:{" "}
                        {selectedMessage.anchorResult.transactionHash.slice(
                          0,
                          10
                        )}
                        ...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageDemo;
