import {job} from "@listenai/lisa_core/lib/task";
import parseArgs from "../utils/parseArgs";
import {ENV_CACHE_DIR, FRAMEWORK_PACKAGE_DIR, PYTHON_VENV_DIR} from "../const";
import {outputJSON, rm} from "fs-extra";
import {LisaType} from "../utils/lisa_ex";
import {
    applyNewVersion,
    getLatestTagByProjectId, getLocalEnvironment,
    getProjectIdByName, listProjects
} from "../utils/framework";
import makeEnv from "../utils/makeEnv";
import {join} from "path";

export interface IHash {
    [details: string] : string;
}

export default ({ got }: LisaType) => {
    job('use-env', {
        title: '环境设置',
        async task(ctx, task) {
            const { args, printHelp } = parseArgs({
                clear: { help: "清除设置" },
                list: { short: 'l', help: '列出所有可用环境' },
                reload: { help: '重载环境包（用于加载本地环境包后更新环境变量）' },
                delete: { short: 'd', help: '删除环境包' },
                'task-help': { short: 'h', help: '打印帮助' },
            });
            if (args['task-help']) {
                return printHelp(["use-env [env_name@env_version] [--delete]", "use-env --clear", "use-env --list"]);
            }

            const execArgsIndex = process.argv.indexOf("use-env");
            const execArgs = process.argv.slice(execArgsIndex + 1);

            if (args["clear"]) {
                task.output = '正在清理...';
                //clear environment
                await rm(PYTHON_VENV_DIR, { recursive: true, force: true, maxRetries: 10 });
                await rm(FRAMEWORK_PACKAGE_DIR, { recursive: true, force: true, maxRetries: 10 });

                return (task.title = '当前环境: (未设置)');
            } else if (args["list"]) {
                let outputResult = "=== 可用环境包 ===\n";
                const result = await listProjects(got);
                for (const p of result) {
                    outputResult += p.name + '\n';
                }

                return (task.title = outputResult);
            } else if (args["reload"]) {
                task.title = "正在根据环境包目录重载环境变量...";
                await outputJSON(join(ENV_CACHE_DIR, 'cache.json'), await makeEnv());
                return (task.title = "完成");
            } else if (args["delete"]) {
                const requestedPackages = execArgs[0].split(',');
                let pIdx = 0, pCount = requestedPackages.length;
                task.title = '正在卸载环境包...';
                for (const p of requestedPackages) {
                    task.output = `[ ${++pIdx} / ${pCount} ] 正在卸载 ${p} ...`;
                    await rm(join(FRAMEWORK_PACKAGE_DIR, p), { recursive: true, force: true, maxRetries: 10 });
                }
                const localEnv = await getLocalEnvironment();
                if (localEnv.length === 0) {
                    await rm(PYTHON_VENV_DIR, { recursive: true, force: true, maxRetries: 10 });
                }

                task.title = "正在根据环境包目录重载环境变量...";
                await outputJSON(join(ENV_CACHE_DIR, 'cache.json'), await makeEnv());
                return (task.title = "完成");
            } else {
                let localEnv = await getLocalEnvironment();
                const requestedPackagesRaw = execArgs[0].split(',');
                const requestedPackages:{name: string, version:string}[] = [];
                let pHash: IHash = {};

                //parse and prepare installation to-do list
                task.output = '正在准备安装...';
                for(const p of requestedPackagesRaw) {
                    const pkgInfoArray = p.split('@');
                    let pItem = {
                        name: p.indexOf('@') >= 0 ? pkgInfoArray[0] : p,
                        version: p.indexOf('@') >= 0 ? pkgInfoArray[1] : "0.0.0"
                    };
                    if (pItem.name.length == 0 || pItem.version.length < 5) {
                        throw new Error(`环境包名称/版本不正确。package = ${p}`);
                    }
                    if (pHash[pItem.name]) {
                        continue;
                    } else {
                        pHash[pItem.name] = "1";
                    }

                    if (pItem.version == '0.0.0') {
                        const projectId = await getProjectIdByName(pItem.name, got);
                        const isBeta = process.env.LISA_ENV === 'debug';
                        pItem.version = (await getLatestTagByProjectId(projectId, isBeta, got)).substring(1);
                    }

                    requestedPackages.push(pItem);
                }

                //install according to to-do list
                let pIdx = 0, pCount = requestedPackages.length;
                for (const p of requestedPackages) {
                    task.title = `[ ${++pIdx} / ${pCount} ] 正在安装 ${p.name} (${p.version})...`;
                    await applyNewVersion(p.name, p.version, localEnv.length === 0, task, got);
                    task.title = `[ ${pIdx} / ${requestedPackages.length} ] ${p.name} (${p.version}) 安装完成！`;
                    localEnv = await getLocalEnvironment();
                }

                //print summary
                let summaryArray: string[] = [];
                for (let l of localEnv) {
                    summaryArray.push(`${l.name} (${l.version})`);
                }
                return (task.title = `当前环境：${summaryArray.join(', ')}`);
            }

            task.title = 'use-env exit';
        }
    });
}
