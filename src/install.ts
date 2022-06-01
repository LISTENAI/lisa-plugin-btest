import { ensureDir, remove, symlink, outputJSON } from 'fs-extra';
import {join, resolve} from 'path';

import { FRAMEWORK_DIR, LISA_BTEST_HOME, PYTHON_VENV_DIR, PIP_INDEX_URL, ENV_CACHE_DIR } from './const';
import extendExec from './utils/extendExec';
import makeEnv from './utils/makeEnv';

import python from "@binary/python-3.9";
import download from "@xingrz/download2";

(async () => {
  await ensureDir(LISA_BTEST_HOME);
  await remove(join(LISA_BTEST_HOME, 'framework'));
  await symlink(FRAMEWORK_DIR, join(LISA_BTEST_HOME, 'framework'));

  //install python venv
  console.log('Preparing isolated python environment...');
  const exec = extendExec();
  const pyPluginPath = resolve(__dirname, 'node_modules', '@binary', 'python-3.9', 'binary');
  await exec(join(pyPluginPath, 'bin', 'python'), [
    "-m",
    "venv",
    PYTHON_VENV_DIR,
    "--upgrade-deps",
  ]);

  //install default requirements
  console.log('Install default packages...');
  await exec(join(PYTHON_VENV_DIR, 'bin', 'pip'), [
      'install',
      '-i',
      PIP_INDEX_URL,
      'parse', 'pyocd', 'pyserial', 'pytest', 'pyyaml',
  ]);
  console.log("Isolated python environment ready!");

  //create env file
  await outputJSON(join(ENV_CACHE_DIR, 'cache.json'), await makeEnv());
})();
