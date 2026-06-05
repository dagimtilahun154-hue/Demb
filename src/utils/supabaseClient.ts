import { hasSupabaseConfig, supabase } from './supabase';

export interface SupabaseProfile {
  id: string;
  name: string;
  recovery_score: number;
  streak_count: number;
  current_status: string;
}

export interface SupabaseBuddyEvent {
  id: string;
  name: string;
  event: 'lock' | 'success' | 'cheer';
  detail: string;
  timestamp: string;
}

export interface AuthProfileInput {
  name: string;
  email: string;
}

export async function getCachedAuthUser() {
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export async function signUpWithEmail({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}) {
  if (!hasSupabaseConfig || !supabase) {
    return { user: null, error: 'Supabase is not configured.' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    return { user: null, error: error.message };
  }

  if (data.user) {
    await syncUserProfile({
      id: data.user.id,
      name,
      recovery_score: 0,
      streak_count: 0,
      current_status: 'Balanced',
    });
  }

  return { user: data.user, error: null };
}

export async function signInWithEmail({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  if (!hasSupabaseConfig || !supabase) {
    return { user: null, error: 'Supabase is not configured.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data.user, error: null };
}

export async function signOutSupabase() {
  if (supabase) {
    await supabase.auth.signOut();
  }
}

export async function syncUserProfile(profile: SupabaseProfile): Promise<boolean> {
  if (!hasSupabaseConfig || !supabase) {
    return false;
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' });

  if (error) {
    console.log('[Supabase] Profile sync skipped:', error.message);
    return false;
  }

  return true;
}

export async function fetchUserProfile(userId: string): Promise<Partial<SupabaseProfile> | null> {
  if (!hasSupabaseConfig || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.log('[Supabase] Profile fetch skipped:', error.message);
    return null;
  }

  return data;
}

export async function fetchBuddyGroupData(groupId: string): Promise<any | null> {
  if (!hasSupabaseConfig || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('buddy_groups')
    .select('*')
    .eq('id', groupId)
    .maybeSingle();

  if (error) {
    console.log('[Supabase] Fetch buddy group skipped:', error.message);
    return null;
  }

  return data;
}

export async function fetchBuddyFeed(_userId: string): Promise<SupabaseBuddyEvent[]> {
  if (!hasSupabaseConfig || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('buddy_feed')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15);

  if (error) {
    console.log('[Supabase] Fetch feed skipped:', error.message);
    return [];
  }

  return (data ?? []).map((item: any) => ({
    id: String(item.id),
    name: item.user_name ?? item.name ?? 'Buddy',
    event: (item.event_type ?? item.event ?? 'cheer') as 'lock' | 'success' | 'cheer',
    detail: item.details ?? item.detail ?? '',
    timestamp: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Just now',
  }));
}

export async function pushBuddyFeedEvent(
  userName: string,
  eventType: 'lock' | 'success' | 'cheer',
  details: string
): Promise<boolean> {
  if (!hasSupabaseConfig || !supabase) {
    return false;
  }

  const { error } = await supabase
    .from('buddy_feed')
    .insert({
      user_name: userName,
      event_type: eventType,
      details,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.log('[Supabase] Feed event push skipped:', error.message);
    return false;
  }

  return true;
}

export async function syncRecoveryTree(treeData: {
  id: string;
  level: number;
  leavesCount: number;
  growthStage: string;
}): Promise<boolean> {
  if (!hasSupabaseConfig || !supabase) {
    return false;
  }

  const { error } = await supabase
    .from('recovery_trees')
    .upsert(
      {
        id: treeData.id,
        level: treeData.level,
        leaves_count: treeData.leavesCount,
        growth_stage: treeData.growthStage,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (error) {
    console.log('[Supabase] Tree progress sync skipped:', error.message);
    return false;
  }

  return true;
}
