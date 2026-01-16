import { register } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Use the dev loader that handles .js -> .ts resolution for volume-mounted source files
// The loader-dev.mjs will be mounted at /app/packages/sync-server/loader-dev.mjs
const loaderPath = resolve('/app/packages/sync-server', 'loader-dev.mjs');
const syncServerDir = resolve('/app/packages/sync-server');

register(pathToFileURL(loaderPath).href, pathToFileURL(syncServerDir));
