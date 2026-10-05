export interface ByokTestResult {
  ok: boolean;
  message: string;
  provider: "groq" | "gemini" | "openai";
  remainingRequests?: number;
  remainingTokens?: number;
  resetTokens?: string;
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

      if (resp.status === 401 || resp.status === 403) {
        return {
          ok: false,
          message: "This API key is invalid. Check it or create a new one.",
          provider,
        };
      }
      if (resp.status === 429) {
        return {
          ok: false,
          message: "This provider's allowance is currently used up. Try again after the reset time.",
          provider,
        };
      }
      if (!resp.ok) {
        return {
          ok: false,
          message: "The AI provider is temporarily unavailable. Your saved notes are safe.",
          provider,
        };
      }

      // Check for rate limit headers
      const remReq = resp.headers.get("x-ratelimit-remaining-requests");
      const remTok = resp.headers.get("x-ratelimit-remaining-tokens");
      const resetTok = resp.headers.get("x-ratelimit-reset-tokens");

      return {
        ok: true,
        message: "Connection successful! Groq is connected and ready.",
        provider,
        remainingRequests: remReq ? parseInt(remReq, 10) : undefined,
        remainingTokens: remTok ? parseInt(remTok, 10) : undefined,
        resetTokens: resetTok || undefined,
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

      if (resp.status === 400 || resp.status === 403) {
        return {
          ok: false,
          message: "This API key is invalid. Check it or create a new one.",
          provider,
        };
      }
      if (resp.status === 429) {
        return {
          ok: false,
          message: "This provider's allowance is currently used up. Try again after the reset time.",
          provider,
        };
      }
      if (!resp.ok) {
        return {
          ok: false,
          message: "The AI provider is temporarily unavailable. Your saved notes are safe.",
          provider,
        };
      }

      return {
        ok: true,
        message: "Connection successful! Google Gemini is connected and ready.",
        provider,
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

      if (resp.status === 401 || resp.status === 403) {
        return {
          ok: false,
          message: "This API key is invalid. Check it or create a new one.",
          provider,
        };
      }
      if (resp.status === 429) {
        return {
          ok: false,
          message: "This provider's allowance is currently used up. Try again after the reset time.",
          provider,
        };
      }
      if (!resp.ok) {
        return {
          ok: false,
          message: "The AI provider is temporarily unavailable. Your saved notes are safe.",
          provider,
        };
      }

      return {
        ok: true,
        message: "Connection successful! OpenAI is connected and ready.",
        provider,
      };
    }

    return {
      ok: false,
      message: "Unsupported provider.",
      provider,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      message: "Network error connecting to provider. Check your internet connection.",
      provider,
    };
  }
}
