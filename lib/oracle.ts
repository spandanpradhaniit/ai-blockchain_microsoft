/**
 * Oracle Signing Helpers (Server-Side Only)
 *
 * Signs the risk attestation using the server-side ORACLE_PRIVATE_KEY.
 *
 * messageHash = keccak256(abi.encodePacked(title, amount, ipfsHash, safetyScore))
 *
 * The signature uses EIP-191 "personal_sign" prefix so the contract can
 * recover the signer via ECDSA.recover(toEthSignedMessageHash(hash), sig).
 *
 * ⚠  PRODUCTION DISCLAIMER: This reference implementation uses a single EOA oracle
 *    key. For a real deployment, replace the single-key oracle with:
 *      • A multi-sig oracle committee (e.g. Safe / Gnosis multisig as oracle)
 *      • Chainlink Functions or another decentralized oracle network
 *      • A threshold-signature scheme (TSS) with key-shares across operators
 */
import { keccak256, encodePacked, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export interface OracleAttestationResult {
  messageHash: string;
  signature: string;
  oracleAddress: string;
}

export async function signOracleAttestation(params: {
  title: string;
  amount: string;   // wei as decimal string
  recipient?: string; // address string for AegisDAO.createProposal
  ipfsHash: string;
  safetyScore: number; // 0-100 clamped to uint8
}): Promise<OracleAttestationResult | null> {
  const oracleKey = process.env.ORACLE_PRIVATE_KEY;
  if (!oracleKey || oracleKey.trim() === "") return null;

  try {
    const formattedKey = (
      oracleKey.startsWith("0x") ? oracleKey : `0x${oracleKey}`
    ) as `0x${string}`;

    const account = privateKeyToAccount(formattedKey);

    const safetyScoreUint8 = Math.min(Math.max(Math.round(params.safetyScore), 0), 255);
    const amountBigInt = BigInt(params.amount || "0");

    let messageHash: `0x${string}`;
    if (params.recipient) {
      // Replicate AegisDAO.createProposal: keccak256(abi.encodePacked(title, amount, recipient, ipfsHash, safetyScore))
      messageHash = keccak256(
        encodePacked(
          ["string", "uint256", "address", "string", "uint8"],
          [params.title, amountBigInt, params.recipient as `0x${string}`, params.ipfsHash, safetyScoreUint8]
        )
      );
    } else {
      // Replicate AegisGovernor.proposeWithAttestation: keccak256(abi.encodePacked(title, amount, ipfsHash, safetyScore))
      messageHash = keccak256(
        encodePacked(
          ["string", "uint256", "string", "uint8"],
          [params.title, amountBigInt, params.ipfsHash, safetyScoreUint8]
        )
      );
    }

    const signature = await account.signMessage({
      message: { raw: toBytes(messageHash) },
    });

    return {
      messageHash,
      signature,
      oracleAddress: account.address,
    };
  } catch (err) {
    console.error("Oracle signing failed:", err);
    return null;
  }
}
