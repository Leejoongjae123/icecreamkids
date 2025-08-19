// Minimal Supabase client stub to satisfy route handler contracts.
// Replace with real implementation when integrating Supabase.

export async function createClient(): Promise<any> {
  return {
    auth: {},
    from: (_table: string) => ({
      select: () => ({ data: null, error: null }),
    }),
  };
}


