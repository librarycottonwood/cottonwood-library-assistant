import {handleMcp} from './mcp.mjs';
import {publishingTools, publishingCall} from './publishing.mjs';
const origin='https://cottonwood-library-analytics.librarycottonwood.workers.dev';
// This boundary is excluded from automated report repairs. The repairable report
// handler never receives the service binding, a write callback, or bearer tokens.
export async function handleLibraryMcp(request, ctx, reporter, checker, publisher) {
  if (!ctx.auth?.scope?.includes('analytics:read') || ctx.props?.login !== 'librarycottonwood') return new Response('Library authorization required.',{status:403});
  if(request.method!=='POST' || !request.headers.get('Content-Type')?.startsWith('application/json')) return handleMcp(request,{},ctx,reporter,checker);
  if(Number(request.headers.get('Content-Length'))>16384)return new Response('Request too large.',{status:413});
  const text=await request.text();
  if(new TextEncoder().encode(text).length>16384)return new Response('Request too large.',{status:413});
  let message;
  try {message=JSON.parse(text);} catch {return Response.json({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Invalid JSON.'}},{status:400});}
  if(message?.jsonrpc==='2.0' && message.id!==undefined && message.method==='tools/call' && publishingTools.some(tool=>tool.name===message.params?.name)) {
    const result=await publishingCall(message.params.name,message.params.arguments??{},ctx,publisher,origin);
    return Response.json({jsonrpc:'2.0',id:message.id,result},{headers:{'Cache-Control':'no-store'}});
  }
  const response=await handleMcp(new Request(request,{body:text}),{},ctx,reporter,checker);
  if(!response.ok || !['initialize','tools/list'].includes(message?.method) || message.id===undefined)return response;
  const body=await response.json();
  if(message.method==='tools/list' && body.result?.tools) body.result.tools=[...body.result.tools.filter(tool=>!publishingTools.some(item=>item.name===tool.name)),...publishingTools];
  if(message.method==='initialize' && body.result)Object.assign(body.result,{
    serverInfo:{name:'Cottonwood Library Assistant',version:'0.3.0'},
    instructions:'Answer in friendly everyday language. Website edits: show the checked image IN CHAT with library_website_preview, ask whether to save, and use library_save_website_preview only after explicit volunteer approval. Never require an external approval page. Verify completion with library_website_updates; queued is not saved. Keep opaque versions and IDs internal. Visitor reports cover tracked demo visits only; never turn connection failure into zero.',
  });
  return Response.json(body,{headers:{'Cache-Control':'no-store'}});
}
