import {doIntegrationCheck, getPyocdVersion, getPythonVersion} from "./utils/integration";
import {FRAMEWORK_DIR, PYTHON_VENV_DIR} from "./const";

export async function env(): Promise<Record<string, string>> {
    const integrationResult = await doIntegrationCheck();
    const pythonVersion = await getPythonVersion();
    const pyocdVersion = await getPyocdVersion();

    return {
        venv: pythonVersion,
        pyocd: pyocdVersion,
        FRAMEWORK_DIR: FRAMEWORK_DIR,
        VIRTUAL_ENV: PYTHON_VENV_DIR,
        ...integrationResult
    };
}