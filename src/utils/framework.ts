import extendExec from "./extendExec";
import {ensureDir, outputJSON, pathExists, pathExistsSync, readFile, rm} from "fs-extra";
import {
    ENV_CACHE_DIR,
    FRAMEWORK_PACKAGE_DIR,
    PIP_INDEX_URL,
    PYTHON_VENV_DIR
} from "../const";
import {join, resolve} from "path";
import makeEnv from "./makeEnv";
import {readdirSync} from "fs";

export type LocalEnvironment = {
    name: string,
    version: string,
    projectId: number,
    isInfoCompleted: boolean
};

export async function applyNewVersion (name: string, version: string, isInitNewEnvironment: boolean, task: any, got: any): Promise<void> {
    const gitUrl = `https://cloud.listenai.com/lisa-btest-env/${name}.git`;
    version = version.startsWith('v') ? version.substring(1) : version;

    //check if env exists
    const projectId = await getProjectIdByName(name, got);
    //check if tag exists
    if (!(await checkIfTagExistsByProjectId(version, projectId, got))) {
        throw new Error(`环境包 ${name} 不存在版本 v${version}`);
    }
    //check if env dir exists
    const envPackDir = join(FRAMEWORK_PACKAGE_DIR, name);
    const isEnvPackMetadataExists = await pathExists(join(envPackDir, 'package.json'));

    const exec = extendExec();
    if (isInitNewEnvironment) {
        //initialize python venv
        await rm(PYTHON_VENV_DIR, { recursive: true, force: true, maxRetries: 10 });
        await rm(FRAMEWORK_PACKAGE_DIR, { recursive: true, force: true, maxRetries: 10 });
        await ensureDir(PYTHON_VENV_DIR);
        await ensureDir(FRAMEWORK_PACKAGE_DIR);

        task.output = 'Preparing isolated python environment...';
        const pyPluginPath = resolve(__dirname, '..', '..', 'node_modules', '@binary', 'python-3.9', 'binary');
        const pyPathPrefix = process.platform === 'win32' ?
            pyPluginPath : join(pyPluginPath, 'bin');
        try {
            await exec(join(pyPathPrefix, 'python'), [
                "-m",
                "venv",
                PYTHON_VENV_DIR,
                "--upgrade-deps"
            ], {
                env: {
                    PIP_INDEX_URL: PIP_INDEX_URL
                }
            });
        } catch (e) {
            if ((e as Error).message.includes('check_hostname requires server_hostname')) {
                throw new Error(`Python 虚拟环境初始化失败，请检查网络状态。`);
            } else {
                throw new Error(`Python 虚拟环境初始化失败。Error = ${e}`);
            }
        }
    }

    //checkout environment package
    if (!isEnvPackMetadataExists) {
        task.output = 'Checking out environment package...';
        await exec('git', [ 'clone', '-b', `v${version}`, gitUrl, envPackDir ]);
    }

    //update environment package
    task.output = `Updating ${name} to ${version}...`;
    await exec('git', [ 'fetch', 'origin' ], {
        cwd: envPackDir
    });
    await exec('git', [ 'checkout', `v${version}` ], {
        cwd: envPackDir
    });
    await exec('git', [ 'pull', 'origin', `v${version}` ], {
        cwd: envPackDir
    });

    //install requirements via pip
    task.output = 'Installing pip packages mentioned in requirements.txt...';
    const pipPathPrefix = process.platform === 'win32' ?
        join(PYTHON_VENV_DIR, 'Scripts') : join(PYTHON_VENV_DIR, 'bin');
    const pipRegUrl = typeof(process.env.GITHUB_ACTIONS) !== "undefined" ?
        'https://pypi.org/simple' : PIP_INDEX_URL;
    const defPkgInsArgs = ['install', '-i', pipRegUrl, '-r', 'requirements.txt'];
    await exec(join(pipPathPrefix, 'pip'), defPkgInsArgs, {
        cwd: envPackDir
    });

    //refresh env cache
    await outputJSON(join(ENV_CACHE_DIR, 'cache.json'), await makeEnv());
}

export async function listProjects(got: any): Promise<Array<any>> {
    try {
        const projectsRaw = await got('https://cloud.listenai.com/api/v4/groups/1235/projects');
        const projects: Array<any> = JSON.parse(projectsRaw.body);

        return projects;
    } catch (e) {
        throw new Error(`无法获取环境包信息! Error = ${e}`);
    }
}

export async function getProjectIdByName(name: string, got: any): Promise<number> {
    try {
        const projectInfoRaw = await got(`https://cloud.listenai.com/api/v4/groups/1235/projects?search=${name}`);
        const projectInfo: Array<any> = JSON.parse(projectInfoRaw.body);

        return projectInfo[0]['id'];
    } catch (e) {
        throw new Error(`无法获取环境包信息! name = ${name}, Error = ${e}`);
    }
}

export async function getLatestTagByProjectId(projectId: number, isBeta: boolean, got: any): Promise<string> {
    try {
        const tagsRaw = await got(`https://cloud.listenai.com/api/v4/projects/${projectId}/repository/tags`);
        const tagResultRaw: Array<any> = JSON.parse(tagsRaw.body) as Array<any>;
        const tag = isBeta ? tagResultRaw.find(item => item.name && item.name.startsWith('v') && item.name.includes('-')) :
            tagResultRaw.find(item => item.name && item.name.startsWith('v') && !item.name.includes('-'));
        if (tag === undefined) {
            const channelName = isBeta ? '测试版本' : '稳定版本';
            throw new Error(`${channelName}通道中没有发布任何版本`);
        }

        return tag.name;
    } catch (e) {
        throw new Error(`无法获取环境包版本信息! Error = ${e}`);
    }
}

export async function checkIfTagExistsByProjectId(tag: string, projectId: number, got: any): Promise<boolean> {
    try {
        const tagsRaw = await got(`https://cloud.listenai.com/api/v4/projects/${projectId}/repository/tags?search=v${tag}`);
        const targetTag = (JSON.parse(tagsRaw.body) as Array<any>).find(item => item.name && item.name === `v${tag}`);

        return targetTag !== undefined
    } catch (e) {
        throw new Error(`无法找到版本 ${tag} ! Error = ${e}`);
    }
}

export async function isLocalEnvironmentConfigured() : Promise<boolean> {
    try {
        const pkgPaths = readdirSync(FRAMEWORK_PACKAGE_DIR);
        for (const pkgPath of pkgPaths) {
            if (pathExistsSync(join(FRAMEWORK_PACKAGE_DIR, pkgPath, 'package.json'))) {
                return true;
            }
        }
        return false;
    } catch {
        return false;
    }
}

export async function getLocalEnvironment(): Promise<LocalEnvironment[]> {
    if (!(await pathExists(FRAMEWORK_PACKAGE_DIR))) {
        return [];
    }

    const result:LocalEnvironment[] = [];
    const pkgPaths = readdirSync(FRAMEWORK_PACKAGE_DIR);
    for (const pkgPath of pkgPaths) {
        const thisPkgPath = join(FRAMEWORK_PACKAGE_DIR, pkgPath);
        if (!(pathExistsSync(join(thisPkgPath, 'package.json')))) {
            continue;
        }

        const thisPkgEnv = await getLocalEnvironmentByPackageName(pkgPath);
        if (thisPkgEnv.isInfoCompleted) {
            result.push(thisPkgEnv);
        }
    }

    return result;
}

async function getLocalEnvironmentByPackageName(package_name: string): Promise<LocalEnvironment> {
    const thisPkgPath = join(FRAMEWORK_PACKAGE_DIR, package_name);

    if (!(await pathExists(join(thisPkgPath, 'package.json')))) {
        return {
            name: '',
            version: '',
            projectId: -1,
            isInfoCompleted: false
        };
    }

    let envVersion = '';
    try {
        const exec = extendExec();
        const { stdout } = await exec('git', [ 'describe', '--tags', '--abbrev=0'], {
            cwd: thisPkgPath
        });
        envVersion = stdout.includes('\n') ? stdout.split('\n')[0] : stdout;
        envVersion = envVersion.startsWith('v') ? stdout.substring(1) : stdout;
    } catch (e) {
        return {
            name: '',
            version: '',
            projectId: -1,
            isInfoCompleted: false
        };
    }

    const pkgMetadata = JSON.parse(await readFile(join(thisPkgPath, 'package.json'), 'utf-8'));
    const envName = pkgMetadata.name;
    const projectId = pkgMetadata.repository.projectId;
    if (envName === undefined || envVersion === undefined || projectId === undefined) {
        return {
            name: '',
            version: '',
            projectId: -1,
            isInfoCompleted: false
        };
    }

    return {
        name: envName,
        version: envVersion,
        projectId: projectId,
        isInfoCompleted: true
    };
}