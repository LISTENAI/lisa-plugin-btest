import {job} from "@listenai/lisa_core/lib/task";
import parseArgs from "../utils/parseArgs";
import {FRAMEWORK_PACKAGE_DIR, PYTHON_VENV_DIR} from "../const";
import {rm} from "fs-extra";
import {LisaType} from "../utils/lisa_ex";
import {
    applyNewVersion,
    getLatestTagByProjectId, getLocalEnvironment,
    getProjectIdByName
} from "../utils/framework";

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
                task.output = '正在清理...';
                //clear environment
                await rm(PYTHON_VENV_DIR, { recursive: true, force: true, maxRetries: 10 });
                await rm(FRAMEWORK_PACKAGE_DIR, { recursive: true, force: true, maxRetries: 10 });

                return (task.title = '当前环境: (未设置)');
            } else if (args["update"]) {
                //update environment
                const localEnvironment = await getLocalEnvironment();
                if (!localEnvironment.isInfoCompleted) {
                    throw new Error('环境完整性校验失败，请使用 lisa btest use-env --clear 指令卸载后重新安装环境包。');
                }

                try {
                    const updatedVersionRaw = await getLatestTagByProjectId(localEnvironment.projectId, got);
                    const updatedVersion = updatedVersionRaw.substring(1);
                    const localName = localEnvironment.name;
                    const localVersion = localEnvironment.version;

                    if (localVersion === updatedVersion) {
                        return (task.title = `当前环境 ${localName} - ${localVersion} 已经是最新版本。`);
                    }

                    task.output = `当前版本：${localVersion}, 最新版本：${updatedVersion}`;
                    await applyNewVersion(localName, updatedVersion, false, task, got);

                    return (task.title = `当前环境: ${localName} - ${updatedVersion}`);
                } catch (e) {
                    throw new Error(`无法获得 ${localEnvironment.name} 的版本信息。Error = ${e}`);
                }
            } else {
                //check if any environment installed previously
                const localEnv = await getLocalEnvironment();
                if (localEnv.isInfoCompleted) {
                    task.output = '正在清理...';
                    //clear environment
                    await rm(PYTHON_VENV_DIR, { recursive: true, force: true, maxRetries: 10 });
                    await rm(FRAMEWORK_PACKAGE_DIR, { recursive: true, force: true, maxRetries: 10 });
                }

                //install new environment package
                task.output = '正在准备更新...';
                const packageInfo = execArgs[0];
                let pkgName = packageInfo;
                let pkgVersion = '0.0.0';
                if (packageInfo.indexOf('@') >= 0) {
                    const pkgInfoArray = packageInfo.split('@');
                    pkgName = pkgInfoArray[0];
                    pkgVersion = pkgInfoArray[1];
                } else {
                    const projectId = await getProjectIdByName(pkgName, got);
                    pkgVersion = (await getLatestTagByProjectId(projectId, got)).substring(1);
                }

                task.title = `正在安装 ${pkgName} - ${pkgVersion}`;
                await applyNewVersion(pkgName, pkgVersion, true, task, got);

                const updatedLocalEnvironment = await getLocalEnvironment();

                return (task.title = `当前环境: ${updatedLocalEnvironment.name} - ${updatedLocalEnvironment.version}`);
            }

            task.title = 'use-env exit';
        }
    });
}
