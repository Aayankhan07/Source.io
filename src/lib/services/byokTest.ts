export interface ByokTestResult {
  ok: boolean;
  message: string;
  provider: "groq" | "gemini" | "openai";
  remainingRequests?: number;
  limitRequests?: number;
  remainingTokens?: number;
  limitTokens?: number;
  resetTokens?: string;
  resetRequests?: string;
}

function evaluateProviderStatus(
  status: number,
  provider: "groq" | "gemini" | "openai"
): { ok: false; message: string; provider: typeof provider } | null {
  if (status === 401 || status === 403 || (provider === "gemini" && status === 400)) {
    return {
      ok: false,
      message: "This API key is invalid. Check it or create a new one.",
      provider,
    };
  }
  if (status === 429) {
    return {
      ok: false,
      message: "This provider's allowance is currently used up. Try again after the reset time.",
      provider,
    };
  }
  if (status < 200 || status >= 300) {
    return {
      ok: false,
      message: "The AI provider is temporarily unavailable. Your saved notes are safe.",
      provider,
    };
  }
  return null;
}

function parseRateLimits(headers: Headers) {
  const remReq = headers.get("x-ratelimit-remaining-requests");
  const limReq = headers.get("x-ratelimit-limit-requests");
  const remTok = headers.get("x-ratelimit-remaining-tokens");
  const limTok = headers.get("x-ratelimit-limit-tokens");
  const resetTok = headers.get("x-ratelimit-reset-tokens");
  const resetReq = headers.get("x-ratelimit-reset-requests");

  return {
    remainingRequests: remReq ? parseInt(remReq, 10) : undefined,
    limitRequests: limReq ? parseInt(limReq, 10) : undefined,
    remainingTokens: remTok ? parseInt(remTok, 10) : undefined,
    limitTokens: limTok ? parseInt(limTok, 10) : undefined,
    resetTokens: resetTok || undefined,
    resetRequests: resetReq || undefined,
  };
}

/**
 * Tests a student's personal BYOK key using a minimal 5-token probe.
 * Translates provider errors into friendly, student-facing messages.
 * Never leaks raw stack traces or internal secrets.
 */
export async function testProviderApiKey(
  provider: "groq" | "gemini" | "openai",
  apiKey: string
): Promise<ByokTestResult> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return {
      ok: false,
      message: "Please enter an API key to test.",
      provider,
    };
  }

  try {
    if (provider === "groq") {
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 5,
        }),
      });

      const failure = evaluateProviderStatus(resp.status, provider);
      if (failure) return failure;

      return {
        ok: true,
        message: "Connection successful! Groq is connected and ready.",
        provider,
        ...parseRateLimits(resp.headers),
      };
    }

    if (provider === "gemini") {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
          cleanKey
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "hi" }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        }
      );

      const failure = evaluateProviderStatus(resp.status, provider);
      if (failure) return failure;

      return {
        ok: true,
        message: "Connection successful! Google Gemini is connected and ready.",
        provider,
        limitRequests: 15,
        remainingRequests: 15,
        limitTokens: 1000000,
        remainingTokens: 1000000,
      };
    }

    if (provider === "openai") {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 5,
        }),
      });

      const failure = evaluateProviderStatus(resp.status, provider);
      if (failure) return failure;

      return {
        ok: true,
        message: "Connection successful! OpenAI is connected and ready.",
        provider,
        ...parseRateLimits(resp.headers),
      };
    }

    return {
      ok: false,
      message: "Unsupported provider.",
      provider,
    };
  } catch (_err: unknown) {
    return {
      ok: false,
      message: "Network error connecting to provider. Check your internet connection.",
      provider,
    };
  }
}
