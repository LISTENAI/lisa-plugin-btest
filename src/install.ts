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

  //trigger @binary/python-3.9 download
  console.log('Downloading python3.9 binary...');
  const PACKAGE = 'python-3.9';
  const VERSION = '3.9.7';
  const NAME = `${PACKAGE}-${VERSION}-${process.platform}_${process.arch}.tar.zst`;

  const pyPluginPath = resolve(__dirname, 'node_modules', '@binary', 'python-3.9', 'binary');
  const pyPluginUrl = `https://cdn.iflyos.cn/public/lisa-binary/${PACKAGE}/${NAME}`;

  await remove(pyPluginPath);
  await download(pyPluginUrl, pyPluginPath, {
    extract: true
  });
  if (process.platform != 'win32') {
    await symlink('python3', join(pyPluginPath, 'bin', 'python'));
  }
  //const pyPluginPath = resolve(__dirname, 'node_modules', '@binary', 'python-3.9');
  /*await remove(resolve(pyPluginPath, 'binary'));
  await exec('node', [
      resolve(pyPluginPath, 'lib', 'install.js')
  ]);*/

  //install python venv
  console.log('Preparing isolated python environment...');
  const exec = extendExec();
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
