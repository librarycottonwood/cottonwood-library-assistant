import {defineCliConfig} from 'sanity/cli';
import {studioEnvironment} from './environment';

export default defineCliConfig({
  api: studioEnvironment(process.env),
  deployment: {appId: 'atvxa15iv13so2hw9kkp8zp2', autoUpdates: false},
});
