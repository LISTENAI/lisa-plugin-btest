import {doIntegrationCheck, getPyocdVersion, getPythonVersion} from "./utils/integration";
import {ENVIRONMENT_DIR, PYTHON_VENV_DIR} from "./const";

export async function env(): Promise<Record<string, string>> {
    const integrationResult = await doIntegrationCheck();
    const pythonVersion = await getPythonVersion();
    const pyocdVersion = await getPyocdVersion();
    const env = "legacy - 2.3.0";

    return {
        env: env,
        venv: pythonVersion,
        pyocd: pyocdVersion,
        FRAMEWORK_DIR: ENVIRONMENT_DIR,
        VIRTUAL_ENV: PYTHON_VENV_DIR,
        ...integrationResult
    };
}