import { ensureDir, remove, symlink, pathExistsSync, mkdirp } from 'fs-extra';
import {join, resolve} from 'path';

import {
  ENVIRONMENT_DIR,
  LISA_BTEST_HOME
} from './const';

import download from "@xingrz/download2";

(async () => {
  await ensureDir(LISA_BTEST_HOME);
  await remove(join(LISA_BTEST_HOME, 'framework'));
  await remove(join(LISA_BTEST_HOME, 'env'));
  await symlink(ENVIRONMENT_DIR, join(LISA_BTEST_HOME, 'env'));

  //trigger @binary/python-3.9 download
  console.log('Downloading python3.9 binary...');
  const PACKAGE = 'python-3.9';
  const VERSION = '3.9.7';
  const NAME = `${PACKAGE}-${VERSION}-${process.platform}_${process.arch}.tar.zst`;

  const pyPluginPath = resolve(__dirname, '..', 'node_modules', '@binary', 'python-3.9', 'binary');
  if (!pathExistsSync(pyPluginPath)) {
    await mkdirp(pyPluginPath);
  }

  const pyPluginUrlTemplate = process.env.PYTHON_BIN_URL_TEMPLATE ?? 'https://cdn.iflyos.cn/public/lisa-binary/{{PACKAGE}}/{{NAME}}';
  const pyPluginUrl = pyPluginUrlTemplate.replace('{{PACKAGE}}', PACKAGE).replace('{{NAME}}', NAME);

  await remove(pyPluginPath);
  await download(pyPluginUrl, pyPluginPath, {
    extract: true
  });
  if (process.platform != 'win32') {
    await symlink('python3', join(pyPluginPath, 'bin', 'python'));
  }
})();
