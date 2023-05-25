import {ENVIRONMENT_DIR, FRAMEWORK_PACKAGE_DIR, PYTHON_VENV_DIR} from "../const";
import {join} from "path";
import {getLocalEnvironment} from "./framework";

const PIP_INDEX_URL = process.env.PIP_INDEX_URL || 'https://pypi.tuna.tsinghua.edu.cn/simple';

export default async function makeEnv(override?: string): Promise<Record<string, string>> {
    const env: Record<string, string> = {
        VIRTUAL_ENV: PYTHON_VENV_DIR,
        PIP_INDEX_URL: PIP_INDEX_URL,
        PYTHONPATH: ''//join(FRAMEWORK_PACKAGE_DIR, 'python')
    };

    const seperator = process.platform === 'win32' ? ';' : ':';

    if (process.platform === 'win32') {
        env['Path'] = `${PYTHON_VENV_DIR}${seperator}${join(PYTHON_VENV_DIR, 'Scripts')}`;
    } else {
        env['PATH'] = `${PYTHON_VENV_DIR}${seperator}${join(PYTHON_VENV_DIR, 'bin')}`;
    }

    const envPathArray: string[] = [];
    for (const e of await getLocalEnvironment()) {
        envPathArray.push(join(FRAMEWORK_PACKAGE_DIR, e.name, 'python'));
    }
    env['PYTHONPATH'] = envPathArray.join(seperator);

    return env;
}