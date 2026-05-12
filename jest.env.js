// Placeholder env vars so modules that call createClient() at import time
// don't throw before any mocks are applied.
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
