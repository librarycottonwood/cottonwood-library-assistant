import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { sanityConfig, fetchSanitySnapshot } from '../src/content/sanity.mjs';
import { readSnapshot, saveSnapshot, contentDigest } from './cms.mjs';
import { check as checkImages } from './images.mjs';

const mode=process.env.LIBRARY_CONTENT_SOURCE??'local';
if (!['local','sanity'].includes(mode)) throw Error('LIBRARY_CONTENT_SOURCE must be local or sanity.');
const environment={...process.env};
const outputDirectory=path.resolve(environment.CMS_BUILD_OUT_DIR??'dist');
const relativeOutput=path.relative(process.cwd(),outputDirectory);
if (relativeOutput!=='dist' && !/^output\/[a-zA-Z0-9_./-]+$/.test(relativeOutput)) throw Error('CMS_BUILD_OUT_DIR must be dist or a folder inside output/.');
let snapshot;
if (mode==='sanity') {
  const config=sanityConfig();
  if (environment.SANITY_SNAPSHOT_PATH) snapshot=await readSnapshot(environment.SANITY_SNAPSHOT_PATH,config);
  else {
    snapshot=await fetchSanitySnapshot(config,{token:environment.SANITY_READ_TOKEN});
    environment.SANITY_SNAPSHOT_PATH=path.resolve('output/cms/build-snapshot.json');
    await saveSnapshot(snapshot,environment.SANITY_SNAPSHOT_PATH);
  }
  // The renderer receives a frozen, validated public-content file, not credentials.
}
delete environment.SANITY_READ_TOKEN;
delete environment.SANITY_WRITE_TOKEN;
execFileSync('pnpm',['exec','astro','build','--outDir',outputDirectory],{stdio:'inherit',env:environment});
if (snapshot) {
  let sourceSha=null,workingTreeChanged=true;
  try {
    sourceSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
    workingTreeChanged=Boolean(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim());
  } catch {}
  await mkdir(path.join(outputDirectory,'_content'),{recursive:true});
  await writeFile(path.join(outputDirectory,'_content/version.json'),JSON.stringify({provider:'sanity',contentDigest:contentDigest(snapshot),sourceSha,workingTreeChanged})+'\n');
}
const problems=await checkImages({dist:relativeOutput});
if(problems.length) throw Error('Picture check failed:\n- '+problems.join('\n- '));
console.log('Picture check passed.');
