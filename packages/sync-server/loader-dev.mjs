import { existsSync } from 'node:fs';
import { resolve as nodeResolve, dirname, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const extensions = ['.ts', '.js', '.mts', '.mjs'];

export async function resolve(specifier, context, nextResolve) {
  // Handle relative imports
  if (specifier.startsWith('.')) {
    const parentURL = context.parentURL;
    if (parentURL) {
      const parentPath = new URL(parentURL).pathname;
      const parentDir = dirname(parentPath);
      const specifierExt = extname(specifier);

      // If import has no extension, try extensions in order
      if (!specifierExt) {
        for (const ext of extensions) {
          const resolvedPath = nodeResolve(parentDir, `${specifier}${ext}`);
          if (existsSync(resolvedPath)) {
            return nextResolve(pathToFileURL(resolvedPath).href, context);
          }
        }
      }
      // If import has .js extension, check for .ts file first (for dev mode with volume mounts)
      // This allows source .ts files to be used when .js imports are requested
      // This is needed because production code imports .js but dev mode uses .ts source files
      else if (specifierExt === '.js') {
        const tsPath = nodeResolve(parentDir, specifier.replace(/\.js$/, '.ts'));
        if (existsSync(tsPath)) {
          return nextResolve(pathToFileURL(tsPath).href, context);
        }
        // Fall through to normal resolution if .ts doesn't exist (will find .js in production)
      }
    }
  }

  return nextResolve(specifier, context);
}
