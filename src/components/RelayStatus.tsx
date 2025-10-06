import React from "react";
import { useRelay } from "../contexts/RelayContext";

const RelayStatus: React.FC = () => {
  const { isConnected, error } = useRelay();

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span className="text-sm font-mono">
        Relay: {isConnected ? "Connected" : "Disconnected"}
      </span>
      {error && (
        <span className="text-xs text-red-400 font-mono">({error})</span>
      )}
    </div>
  );
};

export default RelayStatus;

