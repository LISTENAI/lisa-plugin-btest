import { ensureDir, remove, symlink, outputJSON, pathExistsSync, mkdirp } from 'fs-extra';
import {join, resolve} from 'path';

import { FRAMEWORK_DIR, LISA_BTEST_HOME, PYTHON_VENV_DIR, PIP_INDEX_URL, ENV_CACHE_DIR } from './const';
import extendExec from './utils/extendExec';
import makeEnv from './utils/makeEnv';

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

  const pyPluginPath = resolve(__dirname, '..', 'node_modules', '@binary', 'python-3.9', 'binary');
  if (!pathExistsSync(pyPluginPath)) {
    await mkdirp(pyPluginPath);
  }

  console.log(pyPluginPath);
  const pyPluginUrlTemplate = process.env.PYTHON_BIN_URL_TEMPLATE ?? 'https://cdn.iflyos.cn/public/lisa-binary/{{PACKAGE}}/{{NAME}}';
  const pyPluginUrl = pyPluginUrlTemplate.replaceAll('{{PACKAGE}}', PACKAGE).replaceAll('{{NAME}}', NAME);
  console.log(`Downloading from ${pyPluginUrl}`);

  await remove(pyPluginPath);
  await download(pyPluginUrl, pyPluginPath, {
    extract: true
  });
  if (process.platform != 'win32') {
    await symlink('python3', join(pyPluginPath, 'bin', 'python'));
  }

  //install python venv
  console.log('Preparing isolated python environment...');
  //const pyPluginPath = resolve(__dirname, '..', 'node_modules', '@binary', 'python-3.9', 'binary');
  const exec = extendExec();
  const pyPathPrefix = process.platform === 'win32' ?
      pyPluginPath : join(pyPluginPath, 'bin');
  await exec(join(pyPathPrefix, 'python'), [
    "-m",
    "venv",
    PYTHON_VENV_DIR,
    "--upgrade-deps",
  ]);

  //install default requirements
  console.log('Install default packages...');
  const pipPathPrefix = process.platform === 'win32' ?
      join(PYTHON_VENV_DIR, 'Scripts') : join(PYTHON_VENV_DIR, 'bin');
  const npmRegUrl = typeof(process.env.GITHUB_ACTIONS) !== "undefined" ?
      'https://pypi.org/simple' : PIP_INDEX_URL;
  await exec(join(pipPathPrefix, 'pip'), [
      'install',
      '-i',
      npmRegUrl,
      'parse', 'pyocd', 'pyserial', 'pytest', 'pyyaml',
  ]);
  console.log("Isolated python environment ready!");

  //create env file
  await outputJSON(join(ENV_CACHE_DIR, 'cache.json'), await makeEnv());
})();
