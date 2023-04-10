import {readdirSync, readFileSync, statSync} from "fs";
import {FRAMEWORK_PACKAGE_DIR, PLUGIN_HOME, PYTHON_VENV_DIR} from "../const";
import {BinaryLike, createHash} from "crypto";
import {resolve} from "path";
import {outputJSON, pathExists, readFile, unlink} from "fs-extra";
import {promisify} from "util";
import { execFile as _execFile } from 'child_process';

/**
 * Do integration check of specified framework files
 * @returns {Record<string,string>>} Integration check result (includes summary and details)
 */
export async function doIntegrationCheck(): Promise<Record<string, string>> {
    const integrationFilePath = resolve(FRAMEWORK_PACKAGE_DIR, 'integration.json');
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
    const processed : Record<string, boolean> = {};
    Object.keys(integrationList).forEach(k => {
        processed[k] = false;
    });

    const fileList = getFiles(FRAMEWORK_PACKAGE_DIR);
    let fuse = true;
    for (const f of fileList) {
        if (!integrationList[f]) {
            result['* ' + f] = 'Added';
            fuse = false;
            continue;
        }

        processed[f] = true;
        const expectedHash : string = integrationList[f];
        const fileHash : string = await getFileHashByPath(resolve(PLUGIN_HOME, f));
        if (expectedHash !== fileHash) {
            result['* ' + f] = 'Modified';
            fuse = false;
        }
    }
    Object.keys(processed).forEach(k => {
        if (!processed[k]) {
            result['* ' + k] = 'Deleted';
            fuse = false;
        }
    })
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

    const files = getFiles(FRAMEWORK_PACKAGE_DIR);
    for (const f of files) {
        const hex = await getFileHashByPath(resolve(PLUGIN_HOME, f));
        result[f] = hex;
    }

    const integrationFilePath = resolve(FRAMEWORK_PACKAGE_DIR, 'integration.json');
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
    ignorePath.add('example');
    const ignoreExtensions = new Set();
    ignoreExtensions.add('.so');
    ignoreExtensions.add('.dll');
    ignoreExtensions.add('.lib');
    ignoreExtensions.add('.dylib');
    ignoreExtensions.add('.gitignore');
    ignoreExtensions.add('.npmignore');

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
export async function getFileHashByPath(path: string) : Promise<string> {
    return await getFileHashByStream(readFileSync(path));
}

/**
 * Get hash (SHA256) of a file (by file stream)
 * @param {string} path File stream
 * @returns {string} Hash (SHA256)
 */
export async function getFileHashByStream(fileStream: BinaryLike) : Promise<string> {
    const hashsum = createHash('sha256');
    hashsum.update(fileStream);
    const hex = hashsum.digest('hex');

    return hex;
}

/**
 * Get python version in venv
 * @returns {string} python version
 */
export async function getPythonVersion() : Promise<string> {
    const venvBinPath = resolve(PYTHON_VENV_DIR,
        process.platform == 'win32' ? 'Scripts' : 'bin',
        process.platform == 'win32' ? 'python.exe' : 'python');
    const execFile = promisify(_execFile);

    const { stdout } = await execFile(venvBinPath, ['--version']);
    return stdout.split('\n')[0].trim();
}

/**
 * Get pyocd version in venv
 * @returns {string} pyocd version
 */
export async function getPyocdVersion() : Promise<string> {
    const venvBinPath = resolve(PYTHON_VENV_DIR,
        process.platform == 'win32' ? 'Scripts' : 'bin',
        process.platform == 'win32' ? 'pyocd.exe' : 'pyocd');
    const execFile = promisify(_execFile);

    const { stdout } = await execFile(venvBinPath, ['--version']);
    return stdout.split('\n')[0].trim();
}