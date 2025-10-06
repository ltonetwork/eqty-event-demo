import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { Relay } from "eqty-core";

interface RelayContextType {
  relay: Relay | null;
  isConnected: boolean;
  error: string | null;
}

const RelayContext = createContext<RelayContextType | undefined>(undefined);

export const RelayProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const relayUrl = import.meta.env.VITE_RELAY_URL || "http://localhost:8000";
  const relay = new Relay(relayUrl);

  useEffect(() => {
    const testRelayConnection = async () => {
      try {
        // Test the relay by making a simple GET request
        const response = await fetch(`${relayUrl}/`);
        if (response.ok) {
          setIsConnected(true);
          setError(null);
        } else {
          setIsConnected(false);
          setError(`Relay responded with status: ${response.status}`);
        }
      } catch (err) {
        setIsConnected(false);
        setError(
          err instanceof Error ? err.message : "Failed to connect to relay"
        );
      }
    };

    testRelayConnection();
  }, [relayUrl]);

  return (
    <RelayContext.Provider value={{ relay, isConnected, error }}>
      {children}
    </RelayContext.Provider>
  );
};

export const useRelay = () => {
  const context = useContext(RelayContext);
  if (context === undefined) {
    throw new Error("useRelay must be used within a RelayProvider");
  }
  return context;
};
