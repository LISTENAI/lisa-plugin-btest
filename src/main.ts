import {doIntegrationCheck, getPyocdVersion, getPythonVersion} from "./utils/integration";
import {FRAMEWORK_PACKAGE_DIR, PYTHON_VENV_DIR} from "./const";
import {getLocalEnvironment} from "./utils/framework";

export async function env(): Promise<Record<string, string>> {
    const integrationResult = await doIntegrationCheck();
    const pythonVersion = await getPythonVersion();
    const pyocdVersion = await getPyocdVersion();
    const env = await getLocalEnvironment();

    return {
        env: env.name ? `${env.name} (${env.version})` : '(未设置)',
        venv: pythonVersion,
        pyocd: pyocdVersion,
        FRAMEWORK_DIR: FRAMEWORK_PACKAGE_DIR,
        VIRTUAL_ENV: PYTHON_VENV_DIR,
        ...integrationResult
    };
}