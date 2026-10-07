import { runReport } from './google.mjs';
const tool = {
  name: 'library_website_report',
  description: 'Use this for Cottonwood library website visitor counts, popular pages, directions clicks, and date comparisons. Reads the library demo GA4 property only. Supply explicit dates in the property timezone America/Los_Angeles; infer this week/last week from today. Visitors are active users, visits are sessions, views are page views. No recorded data is different from connection failure. Do not extrapolate demo traffic to the existing public website.',
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  inputSchema: { type: 'object', additionalProperties: false, required: ['report','start_date','end_date'], properties: {
    report: { type:'string',enum:['visitors','pages','directions'] },
    start_date:{type:'string',description:'Inclusive YYYY-MM-DD in America/Los_Angeles.'},end_date:{type:'string',description:'Inclusive YYYY-MM-DD in America/Los_Angeles.'},
    compare_start_date:{type:'string',description:'Optional inclusive comparison start; supply comparison end too.'},compare_end_date:{type:'string',description:'Optional inclusive comparison end; supply comparison start too.'},
    limit:{type:'integer',minimum:1,maximum:25,default:10,description:'Maximum popular pages returned.'},
  } },
};
const statusTool={name:'library_report_connection_status',description:'Check whether a real read-only library report succeeds. Use after reconnecting or on a failed visitor report. Returns the exact connection problem and one next step, never visitor counts or credentials. Does not change accounts, keys or permissions.',annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false},inputSchema:{type:'object',properties:{},additionalProperties:false}};
export async function handleMcp(request,env,ctx,reporter=runReport,checker) {
  if (!ctx.auth?.scope?.includes('analytics:read') || ctx.props?.login !== 'librarycottonwood') return new Response('Library authorization required.',{status:403});
  if (request.method==='GET' || request.method==='DELETE') return new Response(null,{status:405,headers:{Allow:'POST'}});
  if (request.method!=='POST') return new Response(null,{status:405});
  if (!request.headers.get('content-type')?.startsWith('application/json')) return new Response('JSON required.',{status:415});
  if (Number(request.headers.get('content-length')||0)>16384) return new Response('Request too large.',{status:413});
  const text=await request.text();
  if (text.length>16384) return new Response('Request too large.',{status:413});
  let message;
  try { message=JSON.parse(text); } catch { return Response.json({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Invalid JSON.'}},{status:400}); }
  if (!message || Array.isArray(message) || message.jsonrpc!=='2.0' || typeof message.method!=='string') return Response.json({jsonrpc:'2.0',id:message?.id??null,error:{code:-32600,message:'Invalid request.'}},{status:400});
  if (message.id===undefined) return new Response(null,{status:202});
  const reply=result=>Response.json({jsonrpc:'2.0',id:message.id,result},{headers:{'Cache-Control':'no-store'}});
  const error=(code,message)=>Response.json({jsonrpc:'2.0',id:message.id,error:{code,message}},{headers:{'Cache-Control':'no-store'}});
  switch(message.method) {
    case 'initialize': return reply({protocolVersion:['2024-11-05','2025-03-26','2025-06-18','2026-07-28'].includes(message.params?.protocolVersion)?message.params.protocolVersion:'2025-06-18',capabilities:{tools:{}},serverInfo:{name:'Cottonwood Library Analytics',version:'0.1.0'},instructions:'Answer in friendly everyday language. Give the exact period and explain that these are tracked demo visits. Never invent data or turn a connection failure into zero.'});
    case 'ping': return reply({});
    case 'tools/list': return reply({tools:checker?[tool,statusTool]:[tool]});
    case 'tools/call': {
      if(message.params?.name===statusTool.name && checker){
        if(Object.keys(message.params.arguments||{}).length)return error(-32602,'Connection check takes no arguments.');
        try {const result=await checker();return reply({content:[{type:'text',text:JSON.stringify(result)}],structuredContent:result});}
        catch {return reply({isError:true,content:[{type:'text',text:'The connection check is temporarily unavailable. Ask again shortly; do not repeatedly reconnect accounts.'}]});}
      }
      if (message.params?.name!==tool.name) return error(-32602,'Unknown report tool.');
      try { const result=await reporter(message.params.arguments,env);return reply({content:[{type:'text',text:JSON.stringify(result)}],structuredContent:result}); }
      catch(e) { return reply({isError:true,content:[{type:'text',text:JSON.stringify({error:e.code||'temporarily_unavailable',message:e.code?e.message:'The visitor report connection needs attention. Please try again shortly.',...(e.recovery?{recovery:e.recovery}:{})})}]}); }
    }
    default:return error(-32601,'Method not found.');
  }
}
