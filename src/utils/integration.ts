import {readdirSync, readFileSync, statSync} from "fs";
import {FRAMEWORK_DIR, PLUGIN_HOME} from "../const";
import {BinaryLike, createHash} from "crypto";
import {resolve} from "path";
import {outputJSON, pathExists, readFile, unlink} from "fs-extra";

/**
 * Do integration check of specified framework files
 * @returns {Record<string,string>>} Integration check result (includes summary and details)
 */
export async function doIntegrationCheck(): Promise<Record<string, string>> {
    const integrationFilePath = resolve(FRAMEWORK_DIR, 'integration.json');
    if (!await pathExists(integrationFilePath)) {
        return {
            "Framework Integration": "Failed - integration.json does not exist!"
        };
    }

    const result: Record<string, string> = {
        "Framework Integration": "Success"
    };

    const integrationList = JSON.parse(await readFile(integrationFilePath, {
        encoding: 'utf8'
    }));
    const fileList = getFiles(FRAMEWORK_DIR);
    let fuse = true;
    fileList.forEach(f => {
        if (!integrationList[f]) {
            result[f] = 'Added';
            fuse = false;
            return;
        }

        const expectedHash : string = integrationList[f];
        const fileHash : string = getFileHashByPath(resolve(PLUGIN_HOME, f));
        if (expectedHash !== fileHash) {
            result[f] = 'Modified';
            fuse = false;
        }
    });
    if (!fuse) {
        result['Framework Integration'] = 'Failed';
    }

    return result;
}

/**
 * Generate hash of all specified framework files, and have them output to a json
 */
export async function generateIntegrationFile(): Promise<void> {
    const result: Record<string, string> = {};

    const files = getFiles(FRAMEWORK_DIR);
    files.forEach(f => {
        const hex = getFileHashByPath(resolve(PLUGIN_HOME, f));
        result[f] = hex;
    });

    const integrationFilePath = resolve(FRAMEWORK_DIR, 'integration.json');
    if (await pathExists(integrationFilePath)) {
        await unlink(integrationFilePath);
    }

    await outputJSON(integrationFilePath, result);
}

/**
 * Enumerate files within a folder
 * @param {string} dir the root dir to be enumerated
 * @param {string[]} files_ [Not intended for users]
 * @returns {string[]} All files
 */
export function getFiles(dir: string, files_?: string[]): string[] {
    const ignorePath = new Set();
    ignorePath.add('venv');
    ignorePath.add('templates');
    ignorePath.add('integration.json');
    ignorePath.add('cache.json');
    const ignoreExtensions = new Set();
    ignoreExtensions.add('.so');
    ignoreExtensions.add('.dll');
    ignoreExtensions.add('.lib');
    ignoreExtensions.add('.dylib');

    files_ = files_ || [];
    let files = readdirSync(dir);
    for (let i in files) {
        const name = dir + '/' + files[i];
        if (ignorePath.has(files[i]) || ignoreExtensions.has('.' + files[i].split('.', ).pop())) {
            continue;
        }
        if (statSync(name).isDirectory()) {
            getFiles(name, files_);
        } else {
            files_.push(name.replaceAll(PLUGIN_HOME, '').substring(1));
        }
    }
    return files_;
}

/**
 * Get hash (SHA256) of a file (by file path)
 * @param {string} path Path to the file
 * @returns {string} Hash (SHA256)
 */
export function getFileHashByPath(path: string) : string {
    return getFileHashByStream(readFileSync(path));
}

/**
 * Get hash (SHA256) of a file (by file stream)
 * @param {string} path File stream
 * @returns {string} Hash (SHA256)
 */
export function getFileHashByStream(fileStream: BinaryLike) : string {
    const hashsum = createHash('sha256');
    hashsum.update(fileStream);
    const hex = hashsum.digest('hex');

    return hex;
}