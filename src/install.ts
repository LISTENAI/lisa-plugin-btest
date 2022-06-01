import { ensureDir, remove, symlink } from 'fs-extra';
import { join } from 'path';
import { FRAMEWORK_DIR, LISA_BTEST_HOME, PYTHON_VENV_DIR, PIP_INDEX_URL } from './const';
import extendExec from './utils/extendExec';

import python from "@binary/python-3.9";

(async () => {
  await ensureDir(LISA_BTEST_HOME);
  await remove(join(LISA_BTEST_HOME, 'framework'));
  await symlink(FRAMEWORK_DIR, join(LISA_BTEST_HOME, 'framework'));

  //install python venv
  console.log('Preparing isolated python environment...');
  const exec = extendExec();
  await exec(join(python.binaryDir, "python"), [
    "-m",
    "venv",
    PYTHON_VENV_DIR,
    "--upgrade-deps",
  ]);

  //install default requirements
  console.log('Install default packages...');
  await exec(join(python.binaryDir, 'python'), [
      '-m',
      'pip',
      'install',
      '-r',
      join(FRAMEWORK_DIR, 'python', 'default_requirements.txt'),
      '-i',
      PIP_INDEX_URL
  ]);
  console.log("Isolated python environment ready!");
  console.log(python.env);
  console.log(python.binaryDir);
  console.log(python.libraryDir);
  console.log(python.homeDir);
})();
