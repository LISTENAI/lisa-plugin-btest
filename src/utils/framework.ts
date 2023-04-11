import extendExec from "./extendExec";
import {pathExists, readFile, rm} from "fs-extra";
import {FRAMEWORK_PACKAGE_DIR, PIP_INDEX_URL, PYTHON_VENV_DIR} from "../const";
import {join, resolve} from "path";
import makeEnv from "./makeEnv";

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

    const exec = extendExec();
    if (isInitNewEnvironment) {
        //initialize python venv
        await rm(PYTHON_VENV_DIR, { recursive: true, force: true, maxRetries: 10 });

        task.output = 'Preparing isolated python environment...';
        const pyPluginPath = resolve(__dirname, '..', '..', 'node_modules', '@binary', 'python-3.9', 'binary');
        const pyPathPrefix = process.platform === 'win32' ?
            pyPluginPath : join(pyPluginPath, 'bin');
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
        await makeEnv();

        //checkout environment package
        task.output = 'Checking out environment package...';
        await exec('git', [ 'clone', '-b', `v${version}`, gitUrl, FRAMEWORK_PACKAGE_DIR ]);
    }

    //update environment package
    task.output = `Updating ${name} to ${version}...`;
    await exec('git', [ 'fetch', 'origin' ], {
        cwd: FRAMEWORK_PACKAGE_DIR
    });
    await exec('git', [ 'checkout', `v${version}` ], {
        cwd: FRAMEWORK_PACKAGE_DIR
    });
    await exec('git', [ 'pull', 'origin', `v${version}` ], {
        cwd: FRAMEWORK_PACKAGE_DIR
    });

    //install requirements via pip
    task.output = 'Clearing existing packages...';
    const pipPathPrefix = process.platform === 'win32' ?
        join(PYTHON_VENV_DIR, 'Scripts') : join(PYTHON_VENV_DIR, 'bin');
    const pipRegUrl = typeof(process.env.GITHUB_ACTIONS) !== "undefined" ?
        'https://pypi.org/simple' : PIP_INDEX_URL;


    task.output = 'Installing pip packages mentioned in requirements.txt...';
    const defPkgInsArgs = ['install', '-i', pipRegUrl, '-r', 'requirements.txt'];
    await exec(join(pipPathPrefix, 'pip'), defPkgInsArgs, {
        cwd: FRAMEWORK_PACKAGE_DIR
    });
}

export async function getProjectIdByName(name: string, got: any): Promise<number> {
    try {
        const projectInfoRaw = await got(`https://cloud.listenai.com/api/v4/groups/1235/projects?search=${name}`);
        const projectInfo: Array<any> = JSON.parse(projectInfoRaw.body);

        return projectInfo[0].id;
    } catch (e) {
        throw new Error(`无法获取环境包信息! Error = ${e}`);
    }
}

export async function getLatestTagByProjectId(projectId: number, got: any): Promise<string> {
    try {
        const tagsRaw = await got(`https://cloud.listenai.com/api/v4/projects/${projectId}/repository/tags`);
        const tag = (JSON.parse(tagsRaw.body) as Array<any>).find(item => item.name && item.name.startsWith('v'));

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

export async function getLocalEnvironment(): Promise<LocalEnvironment> {
    if (!(await pathExists(join(FRAMEWORK_PACKAGE_DIR, 'package.json')))) {
        return {
            name: '',
            version: '',
            projectId: -1,
            isInfoCompleted: false
        };
    }

    const pkgMetadata = JSON.parse(await readFile(join(FRAMEWORK_PACKAGE_DIR, 'package.json'), 'utf-8'));
    const envName = pkgMetadata.name;
    const envVersion = pkgMetadata.version;
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