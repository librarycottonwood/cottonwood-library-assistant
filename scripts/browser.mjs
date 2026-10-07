import { access } from 'node:fs/promises';
import { chromium } from 'playwright';

export async function launchBrowser(options={}) {
  let executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if(!executablePath){try{await access('/usr/bin/chromium');executablePath='/usr/bin/chromium';}catch{}}
  return chromium.launch({executablePath,headless:true,...options});
}
