import { readJson } from 'fs-extra';
import { join } from 'path';
import { ENV_CACHE_DIR } from '../const';

const ENV_FILE = join(ENV_CACHE_DIR, 'cache.json');

export default async function getEnv(override?: string): Promise<Record<string, string>> {
  return await readJson(ENV_FILE);
}
