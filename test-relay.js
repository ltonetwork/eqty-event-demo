// Simple test script to verify relay service is working
const fetch = require("node-fetch");

async function testRelay() {
  const relayUrl = "http://localhost:8000";

  try {
    console.log("Testing relay service at:", relayUrl);

    // Test basic connectivity
    const response = await fetch(`${relayUrl}/api`);
    console.log("Relay service status:", response.status);

    if (response.ok) {
      console.log("✅ Relay service is running and accessible");
    } else {
      console.log("❌ Relay service returned error:", response.status);
    }
  } catch (error) {
    console.log("❌ Cannot connect to relay service:", error.message);
    console.log("Make sure the relay service is running on port 8000");
  }
}

testRelay();

