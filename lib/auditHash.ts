import { keccak256, toUtf8Bytes } from "ethers";

export function computeAuditHash(log: {
  user_id: string;
  user_role: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  timestamp: string;
}) {
  const payload = {
    user_id: log.user_id,
    user_role: log.user_role,
    action: log.action,
    resource_type: log.resource_type || "",
    resource_id: log.resource_id || "",
    timestamp: log.timestamp,
  };

  return keccak256(toUtf8Bytes(JSON.stringify(payload)));
}
