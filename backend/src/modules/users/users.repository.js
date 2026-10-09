/**
 * User Repository
 *
 * ARCHITECTURAL RULE:
 * ALL database queries for user management live here.
 * Repositories execute queries using createUserClient(accessToken) to enforce Postgres RLS,
 * or supabaseAdmin for explicitly trusted server/admin operations.
 */

/**
 * Fetch profile by user ID.
 * Runs as caller under RLS.
 */
export const getProfileById = async (client, userId) => {
  const { data, error } = await client
    .from('profiles')
    .select('id, email, full_name, avatar_url, phone, onboarding_completed, deleted_at, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Fetch user settings by user ID.
 * Runs as caller under RLS.
 */
export const getSettingsByUserId = async (client, userId) => {
  const { data, error } = await client
    .from('user_settings')
    .select('locale, timezone, notifications, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Fetch assigned roles for a user.
 * Runs as caller under RLS.
 */
export const getRolesByUserId = async (client, userId) => {
  const { data, error } = await client
    .from('user_roles')
    .select('role_id, roles:roles(id, name)')
    .eq('user_id', userId);

  if (error) throw error;
  return (data || []).map((row) => row.roles?.name).filter(Boolean);
};

/**
 * Update user profile.
 * Runs as caller under RLS.
 */
export const updateProfile = async (client, userId, updates) => {
  const { data, error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('id, email, full_name, avatar_url, phone, onboarding_completed, deleted_at, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update user settings.
 * Runs as caller under RLS.
 */
export const updateSettings = async (client, userId, updates) => {
  const { data, error } = await client
    .from('user_settings')
    .update(updates)
    .eq('user_id', userId)
    .select('locale, timezone, notifications, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
};

/**
 * Soft delete profile.
 * Uses supabaseAdmin because setting deleted_at may restrict further user updates
 * and requires trusted system privilege.
 */
export const softDeleteProfile = async (adminClient, userId) => {
  const { data, error } = await adminClient
    .from('profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, deleted_at')
    .single();

  if (error) throw error;
  return data;
};

/**
 * Create an audit log entry.
 * Uses supabaseAdmin because client policies do not allow direct writing to audit_logs.
 */
export const createAuditLog = async (adminClient, { userId, action, metadata = {}, ipAddress = null }) => {
  const { error } = await adminClient.from('audit_logs').insert({
    user_id: userId,
    action,
    metadata,
    ip_address: ipAddress,
  });

  if (error) {
    // Log error but do not fail operation if audit log insert encounters issues
    console.error('Failed to write audit log:', error);
  }
};

/**
 * List paginated users for admin.
 * Uses supabaseAdmin because admins need to query across all profile records.
 */
export const listUsersAdmin = async (adminClient, { page = 1, limit = 20 }) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await adminClient
    .from('profiles')
    .select('id, email, full_name, avatar_url, phone, onboarding_completed, deleted_at, created_at, updated_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { users: data || [], total: count || 0, page, limit };
};
