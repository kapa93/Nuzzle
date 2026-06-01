// @ts-ignore Deno resolves remote imports for Supabase Edge Functions.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: { get: (name: string) => string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Images are uploaded under a `{userId}/...` prefix in each bucket. Deleting the
// auth user cascades all database rows, but storage objects are not cascaded,
// so we remove them explicitly here.
const STORAGE_BUCKETS = ["profile-images", "dog-images", "post-images"];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

type StorageEntry = { name: string; id: string | null };

// Supabase storage `list` only returns one level. Folder placeholders come back
// with a null `id`, so we recurse into them to collect every file path.
async function collectUserFilePaths(
  client: SupabaseClient,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return [];

  const paths: string[] = [];
  for (const entry of data as StorageEntry[]) {
    const entryPath = `${prefix}/${entry.name}`;
    if (entry.id === null) {
      paths.push(...(await collectUserFilePaths(client, bucket, entryPath)));
    } else {
      paths.push(entryPath);
    }
  }
  return paths;
}

async function removeUserStorage(client: SupabaseClient, userId: string): Promise<void> {
  for (const bucket of STORAGE_BUCKETS) {
    const paths = await collectUserFilePaths(client, bucket, userId);
    if (paths.length === 0) continue;
    await client.storage.from(bucket).remove(paths);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const supabaseAnonKey = getRequiredEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

    // Identify the caller from their JWT. A user can only delete their own account.
    const authorization = req.headers.get("Authorization") ?? "";
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userId = authData.user.id;
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Best-effort storage cleanup — never block account deletion if it fails.
    try {
      await removeUserStorage(adminClient, userId);
    } catch (storageErr) {
      console.error("delete-account storage cleanup failed:", storageErr);
    }

    // Deleting the auth user cascades all owned rows via ON DELETE CASCADE.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("delete-account deleteUser failed:", deleteError);
      return json({ error: deleteError.message }, 500);
    }

    return json({ success: true });
  } catch (err) {
    console.error("delete-account error:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
