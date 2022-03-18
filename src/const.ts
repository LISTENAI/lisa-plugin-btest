import { homedir } from 'os';
import { resolve } from 'path';

export const LISA_BTEST_HOME = resolve(homedir(), '.listenai', 'lisa-btest');
export const FRAMEWORK_DIR = resolve(__dirname, '..', 'framework');
