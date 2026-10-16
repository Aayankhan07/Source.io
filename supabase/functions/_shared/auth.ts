// Supabase Edge Functions shared request & authentication helpers.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

export interface RequestAuth {
  userId: string;
  authHeader: string;
  userClient: SupabaseClient;
  admin: SupabaseClient;
}

export interface AuthOptions {
  requireApiKey?: {
    envVar: string;
    bodyKey?: string;
    errorMessage?: string;
  };
}

export interface AuthSuccess extends RequestAuth {
  apiKey?: string;
  errorResponse?: null;
}

export interface AuthFailure {
  errorResponse: Response;
}

export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Handle OPTIONS preflight and verify user credentials.
 * Returns either an error Response (which caller can return directly) or authenticated clients and IDs.
 */
export async function authenticateRequest(
  req: Request,
  corsHeaders: Record<string, string>,
  options?: AuthOptions,
): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      errorResponse: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let apiKey: string | undefined;
  if (options?.requireApiKey) {
    const envKey = Deno.env.get(options.requireApiKey.envVar);
    apiKey = options.requireApiKey.bodyKey || envKey;
    if (!apiKey) {
      return {
        errorResponse: new Response(
          JSON.stringify({
            error: options.requireApiKey.errorMessage || `${options.requireApiKey.envVar} not configured`,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        ),
      };
    }
  }

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(SUPABASE_URL, SERVICE);

  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(
    authHeader.replace("Bearer ", ""),
  );
  if (claimsErr || !claimsData?.claims) {
    return {
      errorResponse: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const userId = claimsData.claims.sub as string;

  return {
    userId,
    authHeader,
    userClient,
    admin,
    apiKey,
    errorResponse: null,
  };
}
