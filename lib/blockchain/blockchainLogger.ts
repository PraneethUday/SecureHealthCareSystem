// lib/blockchain/blockchainLogger.ts

import { ethers } from "ethers";
import AuditLogArtifact from "./AuditLog.json";

/**
 * Lazily create contract to avoid API crash at import time
 */
function getAuditContract() {
  const rpcUrl = process.env.GANACHE_RPC_URL || "http://127.0.0.1:7545";
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  const contractAddress = process.env.AUDIT_CONTRACT_ADDRESS;

  if (!privateKey || !contractAddress) {
    throw new Error("Blockchain environment variables missing");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  return new ethers.Contract(
    contractAddress,
    AuditLogArtifact.abi, // ✅ ABI from artifact
    wallet
  );
}

/**
 * WRITE to blockchain (mined transaction)
 * Emits LogRecorded event
 */
export async function logToBlockchain(
  action: string,
  payload: {
    user_id: string;
    user_role: string;
    resource_type?: string;
    resource_id?: string;
    timestamp: string;
  }
) {
  const contract = getAuditContract();

  // Deterministic hash of audit payload
  const hash = ethers.keccak256(
    ethers.toUtf8Bytes(JSON.stringify(payload))
  );

  // ✅ Call the ACTUAL Solidity function
  const tx = await contract.recordLog(action, hash, {
    gasPrice: ethers.parseUnits("3", "gwei"),
  });

  await tx.wait();

  console.log("⛓️ Blockchain audit event emitted:", tx.hash);

  return {
    hash,
    txHash: tx.hash,
  };
}

/**
 * EVENT-BASED verification
 * Checks whether a transaction hash exists on chain
 */
export async function verifyAuditOnBlockchain(
  txHash: string
): Promise<boolean> {
  const provider = new ethers.JsonRpcProvider(
    process.env.GANACHE_RPC_URL || "http://127.0.0.1:7545"
  );

  const receipt = await provider.getTransactionReceipt(txHash);

  // If receipt exists → transaction was mined
  return receipt !== null;
}
