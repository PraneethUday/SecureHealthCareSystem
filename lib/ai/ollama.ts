// Local model access through Ollama. Patient data is only ever sent to this
// host (default: this machine), never to a third-party API.

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
export const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL ?? "llama3.2";
export const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";
export const EMBED_DIM = 768;

// nomic-embed-text is trained with task prefixes; using them improves recall.
const PREFIX = { document: "search_document: ", query: "search_query: " } as const;

export async function embed(texts: string[], kind: keyof typeof PREFIX): Promise<number[][]> {
  const res = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts.map((t) => PREFIX[kind] + t) }),
  });
  if (!res.ok) throw new Error(`Ollama embed failed: ${res.status}`);
  const { embeddings } = (await res.json()) as { embeddings: number[][] };
  if (embeddings.some((e) => e.length !== EMBED_DIM)) {
    throw new Error(`Expected ${EMBED_DIM}-dim embeddings from ${EMBED_MODEL}`);
  }
  return embeddings;
}

export async function chat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      stream: false,
      options: { temperature: 0, num_ctx: 8192 },
    }),
  });
  if (!res.ok) throw new Error(`Ollama chat failed: ${res.status}`);
  const body = (await res.json()) as { message?: { content?: string } };
  return body.message?.content ?? "";
}

/** pgvector literal for PostgREST. */
export const toVector = (v: number[]) => `[${v.join(",")}]`;
