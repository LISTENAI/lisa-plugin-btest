import { homedir } from 'os';
import { resolve } from 'path';

export const LISA_BTEST_HOME = process.env.LISA_HOME ? resolve(process.env.LISA_HOME, 'lisa-btest') :
    resolve(homedir(), '.listenai', 'lisa-btest');
export const PLUGIN_HOME = resolve(__dirname, '..');
export const ENVIRONMENT_DIR = resolve(PLUGIN_HOME, 'env');
export const PYTHON_VENV_DIR = resolve(ENVIRONMENT_DIR, 'python-venv');
export const FRAMEWORK_PACKAGE_DIR = resolve(ENVIRONMENT_DIR, 'framework');
export const PIP_INDEX_URL = 'https://pypi.tuna.tsinghua.edu.cn/simple';
export const ENV_CACHE_DIR = FRAMEWORK_PACKAGE_DIR;