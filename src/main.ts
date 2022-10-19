import {doIntegrationCheck} from "./utils/integration";

export async function env(): Promise<Record<string, string>> {
    const result = doIntegrationCheck();

    return result;
}