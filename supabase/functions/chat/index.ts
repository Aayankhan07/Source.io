// RAG streaming chat for a document. Embeds the question, retrieves top-k chunks,
// streams Gemini response, persists messages, and returns citations as a leading SSE event.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHAT_MODEL = "llama-3.1-8b-instant";
const TOP_K = 6;
const HISTORY_LIMIT = 10;
const EMBED_DIMS = 1536;

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}
function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter((t) => t.length >= 2 && t.length <= 40);
}
// Must match embed_chunks.embedLocal exactly.
function embedQuery(text: string): number[] {
  const v = new Float64Array(EMBED_DIMS);
  const toks = tokenize(text);
  const add = (term: string) => {
    const h = fnv1a(term);
    const idx = h % EMBED_DIMS;
    const sign = (h >>> 31) & 1 ? -1 : 1;
    v[idx] += sign;
  };
  for (let i = 0; i < toks.length; i++) {
    add(toks[i]);
    if (i + 1 < toks.length) add(toks[i] + "_" + toks[i + 1]);
  }
  let norm = 0;
  for (let i = 0; i < EMBED_DIMS; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm) || 1;
  const out = new Array<number>(EMBED_DIMS);
  for (let i = 0; i < EMBED_DIMS; i++) out[i] = v[i] / norm;
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
  if (!GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: "GROQ_API_KEY missing" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(SUPABASE_URL, SERVICE);

  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(
    authHeader.replace("Bearer ", ""),
  );
  if (claimsErr || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claimsData.claims.sub as string;

  let body: { document_id?: string; message?: string };
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { document_id, message } = body;
  if (!document_id || !message?.trim()) {
    return new Response(JSON.stringify({ error: "document_id and message required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: doc } = await admin
    .from("documents")
    .select("id,user_id,title")
    .eq("id", document_id)
    .maybeSingle();
  if (!doc || doc.user_id !== userId) {
    return new Response(JSON.stringify({ error: "Document not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // 1) Embed query and retrieve top-k chunks via RPC.
    const queryEmbedding = embedQuery(message);
    const { data: matches, error: rpcErr } = await admin.rpc("match_document_chunks", {
      _document_id: document_id,
      _query_embedding: `[${queryEmbedding.join(",")}]`,
      _match_count: TOP_K,
    });
    if (rpcErr) console.error("rpc error", rpcErr);

    const passages = (matches ?? []) as Array<{
      id: string; chunk_text: string; order_index: number; similarity: number;
    }>;

    // 2) Build context block with citation tags [n].
    const contextBlock = passages
      .map((p, i) => `[${i + 1}] (chunk #${p.order_index})\n${p.chunk_text}`)
      .join("\n\n---\n\n");

    // 3) Persist user message.
    await admin.from("chat_messages").insert({
      user_id: userId, document_id, role: "user", content: message,
    });

    // 4) Recent history for conversational continuity.
    const { data: history } = await admin
      .from("chat_messages")
      .select("role,content,created_at")
      .eq("document_id", document_id)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);

    const recent = (history ?? []).reverse().slice(0, -1); // exclude the user msg we just inserted

    const systemPrompt = `You are a study assistant grounded in the user's document "${doc.title}".
Answer ONLY using the provided passages below. If the answer isn't in them, say you can't find it in the source.
Cite passages inline using bracket notation like [1], [2] matching the passage numbers.
Be concise, friendly, and use Markdown when helpful.

PASSAGES:
${contextBlock || "(no passages found — tell the user the document hasn't been indexed yet)"}`;

    const aiResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: CHAT_MODEL,
        stream: true,
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          ...recent.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: message },
        ],
      }),
    });

    if (!aiResp.ok || !aiResp.body) {
      const status = aiResp.status;
      const t = await aiResp.text().catch(() => "");
      console.error("groq error", status, t);
      const code = status === 429 ? 429 : 500;
      const errMsg = status === 429
        ? "Rate limit reached on Groq's free tier — please wait a moment and try again."
        : "Groq API error";
      return new Response(JSON.stringify({ error: errMsg }), {
        status: code, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5) Tee stream: forward tokens to client AND buffer for DB insert.
    let assistantText = "";
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        // Emit citations first so the client can render them immediately.
        const citationsPayload = JSON.stringify({
          citations: passages.map((p, i) => ({
            n: i + 1,
            order_index: p.order_index,
            similarity: p.similarity,
            text: p.chunk_text,
          })),
        });
        controller.enqueue(encoder.encode(`event: citations\ndata: ${citationsPayload}\n\n`));

        const reader = aiResp.body!.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            let nl: number;
            while ((nl = buf.indexOf("\n")) !== -1) {
              let line = buf.slice(0, nl);
              buf = buf.slice(nl + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              // forward raw line to client (preserves SSE framing)
              controller.enqueue(encoder.encode(line + "\n"));
              if (!line.startsWith("data: ")) continue;
              const json = line.slice(6).trim();
              if (json === "[DONE]") continue;
              try {
                const parsed = JSON.parse(json);
                const c = parsed.choices?.[0]?.delta?.content;
                if (c) assistantText += c;
              } catch { /* partial json, ignore */ }
            }
          }
          if (buf) controller.enqueue(encoder.encode(buf));
        } catch (e) {
          console.error("stream error", e);
        } finally {
          // Persist assistant message.
          if (assistantText.trim()) {
            await admin.from("chat_messages").insert({
              user_id: userId, document_id, role: "assistant", content: assistantText,
            });
          }
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("chat error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
