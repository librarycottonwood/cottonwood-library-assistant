import test from 'node:test';
import assert from 'node:assert/strict';
import {handleLibraryMcp} from '../src/library-mcp.mjs';
import {publishingTools} from '../src/publishing.mjs';
const origin='https://cottonwood-library-analytics.librarycottonwood.workers.dev';
const ctx={auth:{scope:['analytics:read','website:read','website:save'],userId:'338888442'},props:{login:'librarycottonwood'}};
const call=async(name,args={},context=ctx,publisher={})=>{
  const response=await handleLibraryMcp(new Request(origin+'/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})}),context,undefined,undefined,publisher);
  return (await response.json()).result;
};
test('old read-only report grants cannot preview or save; OAuth step-up is explicit',async()=>{
  let called=false;
  for(const name of ['library_website_preview','library_save_website_preview']){
    const result=await call(name,{version:'x'},{...ctx,auth:{...ctx.auth,scope:['analytics:read']}},{save(){called=true;},preview(){called=true;}});
    assert.equal(result.isError,true);assert.match(result._meta['mcp/www_authenticate'][0],/insufficient_scope/);
  }
  assert.equal(called,false);
});
test('numeric authenticated identity is required, never caller-supplied subject',async()=>{
  const result=await call('library_save_website_preview',{version:'x'},{...ctx,auth:{...ctx.auth,userId:'someone-else'}},{save(){throw Error('must not execute');}});
  assert.equal(result.isError,true);
});
test('checked images are returned as native MCP image content and version stays available',async()=>{
  const image={type:'image',mimeType:'image/png',data:'fixture'};
  const result=await call('library_website_preview',{},ctx,{preview(subject){assert.equal(subject,'338888442');return {status:'review_required',version:'exact-version',image};}});
  assert.deepEqual(result.content[1],image);assert.equal(result.structuredContent.version,'exact-version');assert.equal(result.structuredContent.image,undefined);
});
test('save uses exact opaque version and provider failures cannot leak secrets',async()=>{
  const result=await call('library_save_website_preview',{version:'exact-version'},ctx,{save(subject,version){assert.equal(subject,'338888442');assert.equal(version,'exact-version');return {status:'publish_queued'};}});
  assert.equal(result.structuredContent.status,'publish_queued');
  const failure=await call('library_save_website_preview',{version:'x'},ctx,{save(){throw Error('private-provider-token');}});
  assert.equal(failure.isError,true);assert.ok(!JSON.stringify(failure).includes('private-provider-token'));
  const invalid=await call('library_save_website_preview',{version:'x',subject:'338888442'},ctx,{save(){throw Error('must not execute');}});assert.equal(invalid.isError,true);
});
test('save and prepare are declared writes for native ChatGPT confirmation',()=>{
  for(const tool of publishingTools){assert.equal(tool.annotations.readOnlyHint,!/save_|prepare_/.test(tool.name));assert.equal(tool.securitySchemes[0].type,'oauth2');assert.deepEqual(tool._meta.securitySchemes,tool.securitySchemes);}
});
