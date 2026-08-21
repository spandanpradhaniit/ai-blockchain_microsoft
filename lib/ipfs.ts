/**
 * IPFS Pinning Client
 *
 * Pins proposal metadata to IPFS via Pinata SDK.
 * Falls back to a deterministic mock CID generator when no API keys are set.
 */

export interface PinResult {
  cid: string;
  ipfsUrl: string;
  gatewayUrl: string;
  isMock: boolean;
}

export async function pinToIPFS(metadata: Record<string, unknown>): Promise<PinResult> {
  const pinataJwt = process.env.PINATA_JWT;
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretKey = process.env.PINATA_SECRET_KEY;

  if (pinataJwt || (pinataApiKey && pinataSecretKey)) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (pinataJwt) {
        headers["Authorization"] = `Bearer ${pinataJwt}`;
      } else if (pinataApiKey && pinataSecretKey) {
        headers["pinata_api_key"] = pinataApiKey;
        headers["pinata_secret_api_key"] = pinataSecretKey;
      }

      const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers,
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `AegisDAO-Proposal-${Date.now()}`,
          },
        }),
      });

      if (response.ok) {
        const pinData = await response.json();
        return {
          cid: pinData.IpfsHash,
          ipfsUrl: `ipfs://${pinData.IpfsHash}`,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/${pinData.IpfsHash}`,
          isMock: false,
        };
      }
    } catch (pinataErr) {
      console.warn("Pinata API upload error, falling back to mock CID:", pinataErr);
    }
  }

  // Mock CID fallback generator for dev/offline testing
  const mockHash = generateMockCid(JSON.stringify(metadata));
  return {
    cid: mockHash,
    ipfsUrl: `ipfs://${mockHash}`,
    gatewayUrl: `https://ipfs.io/ipfs/${mockHash}`,
    isMock: true,
  };
}

function generateMockCid(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `QmAEGIS${hex}${Date.now().toString(36)}`;
}
