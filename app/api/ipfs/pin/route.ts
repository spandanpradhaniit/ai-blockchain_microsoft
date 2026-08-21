import { NextResponse } from "next/server";
import { z } from "zod";

const PinataMetadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  author: z.string().optional(),
  targets: z.array(z.string()).default([]),
  values: z.array(z.string()).default([]),
  calldatas: z.array(z.string()).default([]),
  riskAnalysis: z.any().optional(),
  createdAt: z.number().default(() => Date.now()),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const metadata = PinataMetadataSchema.parse(json);

    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;

    if (pinataApiKey && pinataSecretKey) {
      try {
        const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretKey,
          },
          body: JSON.stringify({
            pinataContent: metadata,
            pinataMetadata: {
              name: `AegisDAO-Proposal-${Date.now()}`,
            },
          }),
        });

        if (response.ok) {
          const pinData = await response.json();
          return NextResponse.json({
            cid: pinData.IpfsHash,
            ipfsUrl: `ipfs://${pinData.IpfsHash}`,
            gatewayUrl: `https://gateway.pinata.cloud/ipfs/${pinData.IpfsHash}`,
            isMock: false,
          });
        }
      } catch (pinataErr) {
        console.warn("Pinata API upload error, falling back to mock CID:", pinataErr);
      }
    }

    // Mock CID fallback generator for dev/offline testing
    const mockHash = generateMockCid(JSON.stringify(metadata));
    return NextResponse.json({
      cid: mockHash,
      ipfsUrl: `ipfs://${mockHash}`,
      gatewayUrl: `https://ipfs.io/ipfs/${mockHash}`,
      isMock: true,
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid metadata schema" }, { status: 400 });
  }
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
