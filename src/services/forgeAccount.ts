import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publicKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

// The publishable/anon key is not a secret. Database service-role keys must never enter the renderer.
const client: SupabaseClient | null = url && publicKey
  ? createClient(url, publicKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }) : null;

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Google Identity só está disponível no aplicativo.'));
  if ((window as any).google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;
  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-forge-google-identity]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Não foi possível carregar o login do Google.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.forgeGoogleIdentity = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Não foi possível carregar o login do Google.'));
    document.head.appendChild(script);
  });
  return googleScriptPromise;
}

export const forgeAccount = {
  configured: Boolean(client),
  googleConfigured: Boolean(client && googleClientId),
  async getUser(): Promise<User | null> {
    if (!client) return null;
    const { data } = await client.auth.getUser();
    return data.user;
  },
  async signInWithGoogle(): Promise<User> {
    if (!client) throw new Error('Configure o Supabase do Forge antes de entrar.');
    if (!googleClientId) throw new Error('O login Google precisa de VITE_GOOGLE_CLIENT_ID configurado no build.');
    await loadGoogleIdentityScript();
    return new Promise<User>((resolve, reject) => {
      let settled = false;
      const finishError = (message: string) => {
        if (!settled) { settled = true; reject(new Error(message)); }
      };
      const google = (window as any).google;
      google.accounts.id.initialize({
        client_id: googleClientId,
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: async (response: { credential?: string }) => {
          if (!response.credential) return finishError('O Google não retornou uma credencial.');
          try {
            const { data, error } = await client.auth.signInWithIdToken({ provider: 'google', token: response.credential });
            if (error) throw error;
            if (!data.user) throw new Error('O Google autenticou, mas o usuário não foi retornado pelo Supabase.');
            if (!settled) { settled = true; resolve(data.user); }
          } catch (error) {
            finishError(error instanceof Error ? error.message : 'Não foi possível concluir o login Google.');
          }
        },
      });
      google.accounts.id.prompt((notification: any) => {
        if (notification?.isNotDisplayed?.()) {
          const reason = notification.getNotDisplayedReason?.();
          if (reason && reason !== 'opt_out_or_no_session') finishError('O Google não pôde abrir a janela de login.');
        }
        if (notification?.isSkippedMoment?.()) finishError('Login Google cancelado.');
      });
      window.setTimeout(() => {
        if (!settled) finishError('O login Google não foi concluído. Tente novamente.');
      }, 120000);
    });
  },
  async signIn(email: string, password: string) {
    if (!client) throw new Error('A autenticação do Forge ainda não foi conectada ao Supabase.');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },
  async signUp(email: string, password: string, name: string) {
    if (!client) throw new Error('A autenticação do Forge ainda não foi conectada ao Supabase.');
    const { data, error } = await client.auth.signUp({ email, password, options: { data: { display_name: name } } });
    if (error) throw error;
    return data;
  },
  async resetPassword(email: string) {
    if (!client) throw new Error('A autenticação do Forge ainda não foi conectada ao Supabase.');
    const { error } = await client.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
  async signOut() {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
  },
};