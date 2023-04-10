import {job} from "@listenai/lisa_core/lib/task";
import parseArgs from "../utils/parseArgs";
import {FRAMEWORK_PACKAGE_DIR, PYTHON_VENV_DIR} from "../const";
import {pathExists, readFile, rm} from "fs-extra";
import {join} from "path";
import {LisaType} from "../utils/lisa_ex";
import {applyNewVersion, getLatestTagByProjectId, getProjectIdByName} from "../utils/framework";

export default ({ got }: LisaType) => {
    job('use-env', {
        title: '环境设置',
        async task(ctx, task) {
            const { args, printHelp } = parseArgs({
                clear: { help: "清除设置" },
                update: { help: "更新环境" },
                'task-help': { short: 'h', help: '打印帮助' },
            });
            if (args['task-help']) {
                return printHelp(["use-env [env_name@env_version] [--update]", "use-env --clear"]);
            }

            const execArgsIndex = process.argv.indexOf("use-env");
            const execArgs = process.argv.slice(execArgsIndex + 1);

            if (args["clear"]) {
                //clear environment
                await rm(PYTHON_VENV_DIR, { recursive: true, force: true, maxRetries: 10 });
                await rm(FRAMEWORK_PACKAGE_DIR, { recursive: true, force: true, maxRetries: 10 });

                return (task.title = '当前环境: (未设置)');
            } else if (args["update"]) {
                //update environment
                if (!(await pathExists(join(FRAMEWORK_PACKAGE_DIR, 'package.json')))) {
                    throw new Error('当前没有设置环境，请使用 lisa btest use-env (环境名) 设置。');
                }

                const pkgMetadata = JSON.parse(await readFile(join(FRAMEWORK_PACKAGE_DIR, 'package.json'), 'utf-8'));
                const projectId = pkgMetadata.repository.projectId;

                try {
                    const updatedVersionRaw = await getLatestTagByProjectId(projectId, got);
                    const updatedVersion = updatedVersionRaw.substring(1);
                    const localName = pkgMetadata.name;
                    const localVersion = pkgMetadata.version;

                    if (localVersion === updatedVersion) {
                        return (task.title = `当前环境 ${pkgMetadata.name} - ${localVersion} 已经是最新版本。`);
                    }

                    task.output = `当前版本：${localVersion}, 最新版本：${updatedVersion}`;
                    await applyNewVersion(localName, updatedVersion, false, task);

                    return (task.title = `当前环境: ${pkgMetadata.name} - ${localVersion}`);
                } catch (e) {
                    throw new Error(`无法获得 ${pkgMetadata.name} 的版本信息。Error = ${e}`);
                }
            } else {
                //install new environment package
                const packageInfo = execArgs[0];
                let pkgName = packageInfo;
                let pkgVersion = '0.0.0';
                if (packageInfo.indexOf('@') >= 0) {
                    const pkgInfoArray = packageInfo.split('@');
                    pkgName = pkgInfoArray[0];
                    pkgVersion = pkgVersion[1];
                } else {
                    const projectId = await getProjectIdByName(pkgName, got);
                    pkgVersion = await getLatestTagByProjectId(projectId, got);
                }

                task.output = `正在安装 ${pkgName} - ${pkgVersion}`;
                await applyNewVersion(pkgName, pkgVersion, true, task);

                return (task.title = `当前环境: ${pkgName} - ${pkgVersion}`);
            }

            task.title = 'use-env exit';
        }
    });
}
