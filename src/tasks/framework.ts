import {job} from "@listenai/lisa_core/lib/task";
import parseArgs from "../utils/parseArgs";
import {FRAMEWORK_PACKAGE_DIR, PYTHON_VENV_DIR} from "../const";
import {pathExists, readFile, rm} from "fs-extra";
import {join} from "path";
import {LisaType} from "../utils/lisa_ex";

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

            const applyNewVersion = async (name: string, version: string, isInitNewEnvironment: boolean) => {

            };

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
                    const res = await got(`https://cloud.listenai.com/api/v4/projects/${projectId}/repository/tags`);
                    const tags = (JSON.parse(res.body) as Array<any>).find(item => item.name && item.name.startsWith('v'));
                    const localName = pkgMetadata.name;
                    const localVersion = pkgMetadata.version;
                    const updatedVersion = tags.name.substring(1);

                    if (localVersion === updatedVersion) {
                        return (task.title = `当前环境 ${pkgMetadata.name} - ${localVersion} 已经是最新版本。`);
                    }

                    task.output = `当前版本：${localVersion}, 最新版本：${updatedVersion}`;
                    await applyNewVersion(localName, updatedVersion, false);

                    return (task.title = 'exit');
                } catch (e) {
                    throw new Error(`无法获得 ${pkgMetadata.name} 的版本信息。Error = ${e}`);
                }
            } else {

            }

            task.title = 'use-env exit';
        }
    });
}
