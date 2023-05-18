import { URL } from 'url';
import { readFile } from 'fs/promises';

interface LoaderResult {
    format: "module";
    source: string;
    shortCirtcuit: boolean;
} 
type Loader = (url:string, context:any, defaultLoader:Loader) => Promise<LoaderResult>;

export async function load(url:string, context:any, defaultLoader:Loader) {
  const checkUrl = url.split('?')[0]; // Cutting the possible search parameters
  if (checkUrl.endsWith('.css')
    || checkUrl.endsWith('.ogg')
    || checkUrl.endsWith('.png')
    || checkUrl.endsWith('.vox')
    || checkUrl.endsWith('.vert')
    || checkUrl.endsWith('.frag')) {
    const content = await readFile(new URL(url));
    return {
      format: 'module',
      source: `export default ${JSON.stringify(content.toString())};`,
      shortCircuit: true,
    };
  }
  return defaultLoader(url, context, defaultLoader);
}