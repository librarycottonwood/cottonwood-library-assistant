// Trusted diagnostic policy. No account/permission changes and no raw errors.
export const RECONNECT_URL='https://cottonwood-library-analytics.librarycottonwood.workers.dev/reconnect';
export const GOOGLE_CLIENT_URL='https://console.cloud.google.com/auth/clients?project=cottonwood-library-analytics';
export function recoveryDetail(reason,keylessReady=false) {
  const problems={
    reader_missing:['The library visitor connection has not finished setup.','Open the library Google account and check that it says librarycottonwood@gmail.com.',GOOGLE_CLIENT_URL,'administrator_setup'],
    google_grant_revoked:['Google needs the library to reconnect visitor reports.','Open Reconnect visitor reports and choose librarycottonwood@gmail.com.',RECONNECT_URL,'google_reconnect'],
    google_client_rejected:['The library’s Google connection settings need attention.','Ask the library administrator to open the existing Google connection settings. Repeated sign-in will not repair this.',GOOGLE_CLIENT_URL,'administrator_setup'],
    reader_access_removed:['Google is refusing access to the library’s visitor reports.','Open the library Analytics property and confirm that Cottonwood Library - Demo is selected.', 'https://analytics.google.com/analytics/web/#/a410873133p557596091/admin/property/accessmanagement','property_access'],
    chatgpt_signin_expired:['ChatGPT needs to reconnect its library report connection.','Open the library’s installed visitor report plugin and select Reconnect. Use librarycottonwood on GitHub.','https://chatgpt.com/plugins','chatgpt_reconnect'],
  };
  if(!Object.hasOwn(problems,reason))reason='temporary';
  const selected=(keylessReady && reason==='reader_missing')?
    ['The library visitor connection has not finished setup. Secure Google reconnection can restore report access.','Open Reconnect visitor reports and choose librarycottonwood@gmail.com.',RECONNECT_URL,'google_reconnect']:
    problems[reason]||['The visitor reports are temporarily unavailable.','Wait a little, then ask me to check again.',null,'retry'];
  return {reason,message:selected[0],nextStep:{instruction:selected[1],url:selected[2],kind:selected[3]},
    afterStep:'Check the connection again. Confirm restored access only after a real read-only report succeeds.',
    assistantInstructions:'Give just the next step and its link. Wait for the person before continuing. Never ask for passwords, codes, keys or files in chat; never repeatedly send verification prompts. Do not claim a Google sign-in fixes a rejected client setting.'};
}
export async function connectionStatus(probe,keylessReady=false) {
  const checkedAt=new Date().toISOString();
  try {await probe();return {status:'ok',checkedAt,realReportVerified:true,message:'A real read-only library report succeeded. Visitor reports are connected.'};}
  catch(error){const reason=error.recovery?.reason||'temporary';return {status:error.code==='account_attention'?'account_attention':'temporarily_unavailable',checkedAt,realReportVerified:false,keylessReconnectReady:keylessReady,recovery:recoveryDetail(reason,keylessReady)};}
}

// Daily records use the same human steps as the live diagnostic tool.
export function maintenanceAction(status,reason,keylessReady,repo='librarycottonwood/cottonwood-library-assistant') {
  if(status==='ok')return null;
  if(reason) {
    const detail=recoveryDetail(reason,keylessReady);
    return {step:detail.nextStep.instruction,url:detail.nextStep.url};
  }
  const steps={
    monitor_not_configured:['The library administrator must save the existing connection-check secret in the library repository.',`https://github.com/${repo}/settings/secrets/actions`],
    authorization_check_failed:['The connector sign-in check failed. Keep it unavailable until a checked fix is deployed.',`https://github.com/${repo}/actions/workflows/analytics-deploy.yml`],
    account_attention:['Ask the library assistant to check the visitor report connection before attempting another sign-in.',RECONNECT_URL],
  };
  const selected=steps[status];return selected?{step:selected[0],url:selected[1]}:null;
}
