import { ethers } from "ethers";
import crypto from "crypto";
import AuditLogABI from "./AuditLog.json";

export async function logToBlockchain(
  action: string,
  payload: object
) {
  // Create hash of payload
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");

  // Connect to Ganache
  const provider = new ethers.JsonRpcProvider(
    process.env.GANACHE_RPC_URL
  );

  // Wallet using Ganache private key
  const wallet = new ethers.Wallet(
    process.env.BLOCKCHAIN_PRIVATE_KEY!,
    provider
  );

  // Contract instance
  const contract = new ethers.Contract(
    process.env.AUDIT_CONTRACT_ADDRESS!,
    AuditLogABI.abi,
    wallet
  );

  // Call smart contract
  const tx = await contract.recordLog(
    action,
    "0x" + hash
  );

  await tx.wait();

  console.log("✅ Blockchain log recorded:", action);
}
