const schema = properties => ({type: 'object', properties, additionalProperties: false});
const annotations = readOnlyHint => ({readOnlyHint, destructiveHint: !readOnlyHint, idempotentHint: true, openWorldHint: false});
const makeTool = (name, title, description, inputSchema, scope, readOnly = true) => ({name, title, description, inputSchema,
  annotations: annotations(readOnly), securitySchemes: [{type: 'oauth2', scopes: ['analytics:read', scope]}],
  _meta: {securitySchemes: [{type: 'oauth2', scopes: ['analytics:read', scope]}]}});
export const publishingTools = [
  makeTool('library_website_updates', 'Check library website updates', 'Read recent website preview/save status and the last verified saved website. Use to find a pending update and to verify completion after saving. Do not call a queued update saved.', schema({}), 'website:read'),
  makeTool('library_website_preview', 'Show library website preview', 'Show the actual checked website screenshot IN CHAT before asking whether to save. Returns an image (embed image_url in the reply if the host does not display native tool images), optional exploration link, and an opaque version for saving this exact preview. Keep version and internal IDs out of volunteer prose. Use route to show the page affected by the change, from available_pages. Defaults to the homepage of the newest update; never substitute an older version when the newest is still checking. Ask for save approval in chat after showing the image.', schema({
    update_id: {type: 'string', description: 'Optional update ID from library_website_updates; omit for the newest update.'},
    route: {type: 'string', description: 'Exact website page path, e.g. /librarynews/newsletter/. Choose from available_pages; defaults to /.'},
    view: {type: 'string', enum: ['desktop', 'phone'], description: 'Computer preview by default; phone on request.'},
  }), 'website:read'),
  makeTool('library_prepare_website_preview', 'Prepare library website preview', 'Queue a checked preview of current published CMS content and current website code. Use after supported CMS publication, when no preview is queued, or to refresh stale content. Does not save the trial website. To refresh an expired/failed preview supply its update_id; omit it to reconcile current content without duplicating work. Check status later; never loop.', schema({update_id:{type:'string',description:'Optional failed or expired preview to replace with a fresh checked version.'}}), 'website:read', false),
  makeTool('library_save_website_preview', 'Save this preview to the library trial website', 'Use ONLY after displaying library_website_preview and the volunteer explicitly asks to save that unchanged version in this conversation. Use the exact opaque version returned with the displayed image. ChatGPT confirms this write in chat; never send the volunteer to an external approval page. Saves the checked trial only. Does not launch the public domain. Afterward check library_website_updates until verified; queued is not saved.', {...schema({version: {type: 'string', description: 'Exact opaque version returned by the displayed preview. Do not create, edit, decode, or replace it.'}}), required: ['version']}, 'website:save', false),
];
const allowedErrors = new Set(['preview_not_available','preview_page_unavailable','preview_expired_or_invalid','preview_superseded','preview_not_ready',
  'approval_does_not_match_preview','preview_pictures_unavailable','preview_pictures_unverified','preview_picture_too_large','library_sign_in_required']);
export async function publishingCall(name, args, ctx, publisher, origin) {
  const tool = publishingTools.find(item => item.name === name);
  if (!tool) return null;
  const scopes = tool.securitySchemes[0].scopes;
  if (ctx.auth?.userId !== '338888442' || ctx.props?.login !== 'librarycottonwood') return {
    isError: true, content: [{type: 'text', text: 'Reconnect using the library GitHub account.'}],
  };
  if (scopes.some(scope => !ctx.auth.scope.includes(scope))) return {isError: true,
    content: [{type: 'text', text: 'Connect the library website preview and save permissions to continue in this chat.'}],
    _meta: {'mcp/www_authenticate': [`Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource/mcp", error="insufficient_scope", error_description="Connect website preview and save permissions", scope="analytics:read website:read website:save offline_access"`]},
  };
  if (!args || typeof args !== 'object' || Array.isArray(args) || Object.keys(args).some(key => !Object.hasOwn(tool.inputSchema.properties, key)) ||
      tool.inputSchema.required?.some(key => typeof args[key] !== 'string' || !args[key]) ||
      (args.route !== undefined && (typeof args.route !== 'string' || !/^\/(?:[a-z0-9_-]+\/)*$/.test(args.route))) ||
      (args.view !== undefined && !['desktop','phone'].includes(args.view)) ||
      (args.update_id !== undefined && !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(args.update_id)) ||
      (args.version?.length > 4096)) return {isError: true, content: [{type: 'text', text: 'Invalid website update arguments.'}]};
  try {
    if (!publisher) throw new Error('website_connection_unavailable');
    const subject = ctx.auth.userId;
    const result = name === 'library_website_updates' ? await publisher.status(subject) :
      name === 'library_website_preview' ? await publisher.preview(subject, args.update_id, args.view, args.route) :
      name === 'library_prepare_website_preview' ? await publisher.prepare(subject, args.update_id) : await publisher.save(subject, args.version);
    const {image, ...details} = result;
    return {content: [{type: 'text', text: JSON.stringify(details)}, ...(image ? [image] : [])], structuredContent: details};
  } catch (error) {
    return {isError: true, content: [{type: 'text', text: JSON.stringify({error: allowedErrors.has(error.message) ? error.message : 'website_connection_unavailable',
      message: 'This website step could not finish. Check the latest update before trying again. Do not report it as saved.'})}]};
  }
}
