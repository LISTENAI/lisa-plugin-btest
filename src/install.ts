import { ensureDir, symlink } from 'fs-extra';
import { homedir } from 'os';
import { join, resolve } from 'path';

const LISA_BTEST_HOME = resolve(homedir(), '.listenai', 'lisa-btest');
const FRAMEWORK_DIR = resolve(__dirname, '..', 'framework');

(async () => {
  await ensureDir(LISA_BTEST_HOME);
  await symlink(FRAMEWORK_DIR, join(LISA_BTEST_HOME, 'framework'));
})();
