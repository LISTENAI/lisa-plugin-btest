import {doIntegrationCheck, getPyocdVersion, getPythonVersion} from "./utils/integration";
import {FRAMEWORK_PACKAGE_DIR, PYTHON_VENV_DIR} from "./const";
import {getLocalEnvironment} from "./utils/framework";
import getEnv from "./utils/getEnv";

export async function env(): Promise<Record<string, string>> {
    const envCache = await getEnv();
    //const integrationResult = await doIntegrationCheck();
    const pythonVersion = await getPythonVersion();
    const pyocdVersion = await getPyocdVersion();
    const envRaw = await getLocalEnvironment();
    let envArray: string[] = [];
    for (const e of envRaw) {
        envArray.push(`${e.name} (${e.version})`);
    }

    return {
        env: envArray.length > 0 ? envArray.join(', ') : '(未设置)',
        venv: pythonVersion,
        pyocd: pyocdVersion,
        FRAMEWORK_DIR: FRAMEWORK_PACKAGE_DIR,
        VIRTUAL_ENV: PYTHON_VENV_DIR,
        PYTHONPATH: envCache['PYTHONPATH']
    };
}