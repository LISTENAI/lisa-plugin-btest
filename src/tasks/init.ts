import { job } from '@listenai/lisa_core/lib/task';
import { join, resolve } from 'path';
import { mkdirpSync, cpSync, existsSync } from "fs-extra";

import parseArgs from '../utils/parseArgs';
import workspace from '../utils/workspace';
import {FRAMEWORK_PACKAGE_DIR} from "../const";
import {isLocalEnvironmentConfigured} from "../utils/framework";

export default () => {
    job('init', {
        title: '初始化btest工程环境',
        async task(ctx, task) {
            const { args, printHelp } = parseArgs({
                'prefix': { short: 'p', arg: 'prefix', help: '指定btest脚本所在路径（默认为工程所在目录）' },
                'task-help': { short: 'h', help: '打印帮助' },
            });

            if (args['task-help']) {
                return printHelp();
            }

            if (!await isLocalEnvironmentConfigured()) {
                throw new Error('环境没有初始化！请使用 lisa btest use-env {环境包名} 初始化一个环境。');
            }

            //get optional btest project path, will be firmware project path if undefined
            const projPath = workspace();
            let btestPath = projPath;
            if (args['prefix']) {
                btestPath = resolve(args['prefix']);
            }

            //check if test-case folder already exists
            task.title = '';
            let testCasePath = join(btestPath, 'btests');
            let testCaseConfigPath = join(btestPath, 'lisa-btest.yml');
            if (existsSync(testCasePath) || existsSync(testCaseConfigPath)) {
                throw new Error(`指定的文件夹下已经存在测试用例。请指定另一个路径，然后重试。`);
            }

            //create folder and put samples in there
            try {
                mkdirpSync(join(btestPath, 'btests'));
                cpSync(join(FRAMEWORK_PACKAGE_DIR, 'templates', 'test_sample.py'), join(btestPath, 'btests', 'test_sample.py'));
                cpSync(join(FRAMEWORK_PACKAGE_DIR, 'templates', 'lisa-btest.yml'), join(btestPath, 'lisa-btest.yml'));
            } catch (e) {
                throw new Error(`btest项目初始化失败：\n${e}`);
            }

            //summary
            task.output = `-> 请在Btest工程环境目录下运行 lisa btest dm:init 以获得device-map.yml`;
            task.output = `√ Btest工程环境已经在 ${btestPath} 生成完毕`;
        }, options: {
            persistentOutput: true,
            bottomBar: Infinity
        }
    });
}
