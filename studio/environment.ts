export function studioEnvironment(env: Record<string, string | undefined>) {
  const projectId = env.SANITY_STUDIO_PROJECT_ID?.trim();
  const dataset = env.SANITY_STUDIO_DATASET?.trim();
  if (!projectId || !dataset) {
    throw new Error(
      'The library Sanity account is not connected. Set SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET in studio/.env.local after the library creates its project. No account or dataset is created by this command. For a compilation check only, run pnpm build:offline.',
    );
  }
  if (!/^[a-z0-9-]+$/.test(projectId) || !/^[a-z0-9][a-z0-9_-]*$/.test(dataset)) {
    throw new Error('Use the project ID and dataset name from Sanity Manage, without URLs or spaces.');
  }
  return {projectId, dataset};
}
