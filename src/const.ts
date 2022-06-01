import { homedir } from 'os';
import { resolve } from 'path';

export const LISA_BTEST_HOME = resolve(homedir(), '.listenai', 'lisa-btest');
export const FRAMEWORK_DIR = resolve(__dirname, '..', 'framework');
export const PYTHON_VENV_DIR = resolve(FRAMEWORK_DIR, 'python', 'venv');
export const PIP_INDEX_URL = 'https://pypi.tuna.tsinghua.edu.cn/simple';
export const ENV_CACHE_DIR = resolve(homedir(), '.listenai', 'lisa-btest', 'framework', 'python');