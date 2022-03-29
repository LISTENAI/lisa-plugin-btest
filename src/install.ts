import { ensureDir, remove, symlink } from 'fs-extra';
import { join } from 'path';
import { FRAMEWORK_DIR, LISA_BTEST_HOME } from './const';

(async () => {
  await ensureDir(LISA_BTEST_HOME);
  await remove(join(LISA_BTEST_HOME, 'framework'));
  await symlink(FRAMEWORK_DIR, join(LISA_BTEST_HOME, 'framework'));
})();
