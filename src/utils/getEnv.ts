import { readJson } from 'fs-extra';
import { join } from 'path';
import { ENV_CACHE_DIR } from '../const';

const ENV_FILE = join(ENV_CACHE_DIR, 'cache.json');

export default async function getEnv(override?: string): Promise<Record<string, string>> {
  try {
    return await readJson(ENV_FILE);
  } catch (e) {
    throw new Error('环境没有初始化！请使用 lisa btest use-env {环境包名} 初始化一个环境。');
  }
}
