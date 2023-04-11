import { ENVIRONMENT_DIR, PYTHON_VENV_DIR } from "../const";
import {join} from "path";

const PIP_INDEX_URL = process.env.PIP_INDEX_URL || 'https://pypi.tuna.tsinghua.edu.cn/simple';

export default async function makeEnv(override?: string): Promise<Record<string, string>> {
    const env: Record<string, string> = {
        VIRTUAL_ENV: PYTHON_VENV_DIR,
        PIP_INDEX_URL: PIP_INDEX_URL,
        PYTHONPATH: join(ENVIRONMENT_DIR, 'python-venv')
    };

    if (process.platform === 'win32') {
        env['Path'] = `${PYTHON_VENV_DIR};${join(PYTHON_VENV_DIR, 'Scripts')}`;
    } else {
        env['PATH'] = `${PYTHON_VENV_DIR}:${join(PYTHON_VENV_DIR, 'bin')}`;
    }

    return env;
}