# EQTY Event Demo

A React frontend application for testing the EQTY Core events library with wallet integration.

## Features

- **Wallet Connection**: Connect with MetaMask or other Ethereum wallets
- **Event Chain Demo**: Create and sign events, build event chains
- **Message Demo**: Send and sign messages with different content types
- **Modern UI**: Beautiful, responsive design with glassmorphism effects
- **Real-time Feedback**: See signatures, hashes, and anchor maps

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MetaMask or another Ethereum wallet
- EQTY Core library (for full integration)

### Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start the development server**:

   ```bash
   npm start
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## Usage

### 1. Connect Your Wallet

- Click "Connect Wallet" to connect your MetaMask or other Ethereum wallet
- The app will request permission to access your accounts
- Once connected, you'll see your wallet address and connection status

### 2. Test Event Chains

- **Set Chain ID**: Enter a unique identifier for your event chain
- **Add Events**: Enter JSON data for your events and click "Add Event"
- **View Events**: See all events in your chain with timestamps and signatures
- **Get Anchor Map**: Generate the anchor map for blockchain submission

### 3. Test Messaging

- **Select Message Type**: Choose from text, JSON, or markdown
- **Send Messages**: Enter message content and click "Send Message"
- **View Messages**: See all sent messages with signatures and hashes
- **Anchor Messages**: Anchor message hashes to the blockchain

## Demo Features

### Current Implementation (Mock)

The current demo uses **mock implementations** to simulate EQTY Core functionality:

- **Mock Signing**: Uses wallet's `signMessage()` for demonstration
- **Mock Hashing**: Generates simple hash-like strings
- **Mock Anchoring**: Shows what anchor operations would look like

### Full Integration (Future)

To integrate with the actual EQTY Core library:

1. **Link the library**:

   ```bash
   cd ../eqty-core
   npm link
   cd ../eqty-event-demo
   npm link @eqty-core/events
   ```

2. **Replace mock imports** with actual EQTY Core:

   ```typescript
   import { Event, EventChain, Message, EthersSigner } from "@eqty-core/events";
   ```

3. **Update components** to use real EQTY Core classes instead of mock interfaces

````

## Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Customization

- **Styling**: Modify CSS files in `src/components/` for visual changes
- **Functionality**: Update TypeScript components for new features
- **Integration**: Replace mock implementations with actual EQTY Core calls

## Testing Scenarios

### Event Chain Testing

1. **Basic Event Creation**:

   ```json
   { "action": "user_login", "timestamp": 1234567890 }
````

2. **Complex Event Data**:

   ```json
   {
     "action": "data_update",
     "changes": { "name": "John", "email": "john@example.com" },
     "metadata": { "version": "1.0", "source": "web" }
   }
   ```

3. **Multiple Events**: Add several events to test chain linking

### Message Testing

1. **Text Messages**: Simple text content
2. **JSON Messages**: Structured data
3. **Markdown Messages**: Formatted content

## License

MIT License - see LICENSE file for details
