import { homedir } from 'os';
import { resolve } from 'path';

export const LISA_BTEST_HOME = process.env.LISA_HOME ? resolve(process.env.LISA_HOME, 'lisa-btest') :
    resolve(homedir(), '.listenai', 'lisa-btest');
export const PLUGIN_HOME = resolve(__dirname, '..');
export const FRAMEWORK_DIR = resolve(PLUGIN_HOME, 'framework');
export const PYTHON_VENV_DIR = resolve(FRAMEWORK_DIR, 'python', 'venv');
export const PIP_INDEX_URL = 'https://pypi.tuna.tsinghua.edu.cn/simple';
export const ENV_CACHE_DIR = resolve(LISA_BTEST_HOME, 'framework', 'python');
export const CUSTOM_PYOCD_URL = 'https://cdn.iflyos.cn/public/lisa-binary/pyocd/pyocd-0.34.2.dev20-py3-none-any.whl';
export const REQED_PACKAGES = ['parse', 'pyserial', 'pytest', 'pyyaml', 'tabulate', 'cbor>=1.0.0', 'psutil',
    'pytest-html', 'allure-pytest'];