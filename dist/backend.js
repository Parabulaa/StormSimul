import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const config = window.STORMSIGHT_CONFIG || {};
const configured = Boolean(config.supabaseUrl && config.supabasePublishableKey);
const client = configured
  ? createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

function requireClient() {
  if (!client) throw new Error('Supabase is not configured. Add the Vercel environment variables first.');
  return client;
}

async function signUp(email, password, fullName) {
  const { data, error } = await requireClient().auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/#overview` },
  });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await requireClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await requireClient().auth.signOut();
  if (error) throw error;
}

async function resetPassword(email) {
  const { error } = await requireClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/#settings`,
  });
  if (error) throw error;
}

async function session() {
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

async function listLocations() {
  const { data, error } = await requireClient().from('saved_locations').select('*').order('created_at');
  if (error) throw error;
  return data;
}

async function saveLocation(location) {
  const current = await session();
  if (!current) throw new Error('Sign in before saving a location.');
  const { data, error } = await requireClient()
    .from('saved_locations')
    .insert({ ...location, user_id: current.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteLocation(id) {
  const { error } = await requireClient().from('saved_locations').delete().eq('id', id);
  if (error) throw error;
}

window.StormSightBackend = {
  configured, client, signUp, signIn, signOut, resetPassword, session,
  listLocations, saveLocation, deleteLocation,
};
