import assert from "node:assert/strict";
import test from "node:test";
import { HttpOllamaClient, LocalAiUnavailableError } from "../src/server/knowledge";

test("Ollama client 只向設定的廠內 endpoint 發送生成請求", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = (async (input: string | URL | Request) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({ response: "請檢查感測器。" }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    const client = new HttpOllamaClient("http://ollama:11434", "factory-model");
    assert.equal(await client.generate("測試"), "請檢查感測器。");
    assert.equal(requestedUrl, "http://ollama:11434/api/generate");
  } finally { globalThis.fetch = originalFetch; }
});

test("Ollama client 拒絕公網 endpoint，且不發出請求", async () => {
  const client = new HttpOllamaClient("https://example.com", "factory-model");
  await assert.rejects(() => client.generate("測試"), LocalAiUnavailableError);
});
