import extendExec from "./extendExec";
import {rm} from "fs-extra";
import {FRAMEWORK_PACKAGE_DIR, PIP_INDEX_URL, PYTHON_VENV_DIR} from "../const";
import {join, resolve} from "path";

export async function applyNewVersion (name: string, version: string, isInitNewEnvironment: boolean, task: any): Promise<void> {
    const gitUrl = `https://cloud.listenai.com/lisa-btest-env/${name}.git`;
    version = version.startsWith('v') ? version.substring(1) : version;

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
            "--upgrade-deps",
        ], {
            env: {
                PIP_INDEX_URL: PIP_INDEX_URL
            }
        });

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
    task.output = 'Installing default packages...';
    const pipPathPrefix = process.platform === 'win32' ?
        join(PYTHON_VENV_DIR, 'Scripts') : join(PYTHON_VENV_DIR, 'bin');
    const pipRegUrl = typeof(process.env.GITHUB_ACTIONS) !== "undefined" ?
        'https://pypi.org/simple' : PIP_INDEX_URL;
    const defPkgInsArgs = ['install', '-i', pipRegUrl, '-r', 'requirements.txt'];
    await exec(join(pipPathPrefix, 'pip'), defPkgInsArgs, {
        cwd: FRAMEWORK_PACKAGE_DIR
    });
};

export async function getProjectIdByName(name: string, got: any): Promise<number> {
    try {
        const projectInfoRaw = await got(`https://cloud.listenai.com/api/v4/groups/1235/projects?search=${name}`);
        const projectInfo: Array<any> = JSON.parse(projectInfoRaw.body);

        return projectInfo[0].id;
    } catch (e) {
        throw new Error(`Failed to fetch project ID by name! Error = ${e}`);
    }
}

export async function getLatestTagByProjectId(projectId: number, got: any): Promise<string> {
    try {
        const tagsRaw = await got(`https://cloud.listenai.com/api/v4/projects/${projectId}/repository/tags`);
        const tag = (JSON.parse(tagsRaw.body) as Array<any>).find(item => item.name && item.name.startsWith('v'));

        return tag.name;
    } catch (e) {
        throw new Error(`Failed to fetch tags by id! Error = ${e}`);
    }
}