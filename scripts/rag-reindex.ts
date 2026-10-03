/**
 * Drain the embedding queue (also runs automatically after clinical writes).
 *   npm run rag:index
 */
import { adminClient } from "./lib/admin-client";
import { Keystore } from "../lib/crypto/clinical";
import { processEmbeddingJobs } from "../lib/rag/indexer";

(async () => {
  const admin = adminClient();
  const result = await processEmbeddingJobs(admin, new Keystore(admin), 1000);
  console.log(`Indexed ${result.indexed} source rows, ${result.failed} failed.`);
  if (result.failed) process.exit(1);
})();
