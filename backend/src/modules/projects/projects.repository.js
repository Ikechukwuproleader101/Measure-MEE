/**
 * Project Repository
 *
 * ALL database queries for projects live here.
 * Repositories execute queries using createUserClient(accessToken) to enforce Postgres RLS.
 */

/**
 * List projects for the authenticated user filtered by archived state.
 * Includes measurement count: select('*, measurements(count)').
 * Ordered by created_at descending.
 */
export const listProjects = async (client, userId, isArchived = false) => {
  const { data, error } = await client
    .from('projects')
    .select('*, measurements(count)')
    .eq('client_id', userId)
    .eq('is_archived', isArchived)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Create a new project for the authenticated user.
 */
export const createProject = async (client, userId, name) => {
  const { data, error } = await client
    .from('projects')
    .insert({
      client_id: userId,
      name,
    })
    .select('*, measurements(count)')
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update an existing project for the authenticated user.
 */
export const updateProject = async (client, userId, projectId, updates) => {
  const { data, error } = await client
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .eq('client_id', userId)
    .select('*, measurements(count)')
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Fetch a single project with its measurements.
 */
export const getProjectById = async (client, userId, projectId) => {
  const { data, error } = await client
    .from('projects')
    .select('*, measurements(*)')
    .eq('id', projectId)
    .eq('client_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

