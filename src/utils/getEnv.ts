import { readJson } from 'fs-extra';
import { homedir } from 'os';
import { join } from 'path';

const ENV_FILE = join(homedir(), '.listenai', 'lisa-zephyr', 'envs', 'cache.json');

export default async function getEnv(override?: string): Promise<Record<string, string>> {
  return await readJson(ENV_FILE);
}
