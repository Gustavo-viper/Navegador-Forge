import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publicKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// The publishable/anon key is not a secret. Database service-role keys must never enter the renderer.
const client: SupabaseClient | null = url && publicKey
  ? createClient(url, publicKey, { auth: { persistSession: false } }) : null;

export const forgeAccount = {
  configured: Boolean(client),
  async getUser(): Promise<User | null> {
    if (!client) return null;
    const { data } = await client.auth.getUser();
    return data.user;
  },
  async signIn(email: string, password: string) {
    if (!client) throw new Error('A conta Forge ainda não foi conectada ao Supabase.');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },
  async signUp(email: string, password: string, name: string) {
    if (!client) throw new Error('A conta Forge ainda não foi conectada ao Supabase.');
    const { data, error } = await client.auth.signUp({ email, password, options: { data: { display_name: name } } });
    if (error) throw error;
    return data;
  },
  async resetPassword(email: string) {
    if (!client) throw new Error('A conta Forge ainda não foi conectada ao Supabase.');
    const { error } = await client.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
  async signOut() {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
  },
};