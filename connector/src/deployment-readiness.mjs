// Trusted publisher preflight; no credentials or raw probe errors in records.
export function publisherReadiness(env,probe) {
  if(!env.CLOUDFLARE_API_TOKEN || !env.LIBRARY_ANALYTICS_MONITOR_TOKEN)return {
    state:'publisher_setup_pending',message:'The library administrator must finish storing the existing maintenance credentials. The current connector is retained.'};
  const result=probe();
  if(result.status===0)return null;
  if(result.stderr?.trim()==='account_attention')return {
    state:'account_setup_pending',message:'The library Google report connection needs approval or recovery. The current connector is retained; open the existing visitor report connection check for its next step.'};
  return {state:'connection_attention',message:'The current visitor report connection could not be verified. Publishing is waiting; the current connector is retained.'};
}
