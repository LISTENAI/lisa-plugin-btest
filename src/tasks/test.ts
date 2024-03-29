import { job } from '@listenai/lisa_core/lib/task';
import execa from 'execa';
import { join } from 'path';

import { readProject } from '../utils/project';
import { forceCast } from '../utils/typing';
import workspace from '../utils/workspace';
import parseArgs from "../utils/parseArgs";
import getEnv from "../utils/getEnv";
import {isLocalEnvironmentConfigured} from "../utils/framework";

export default () => {
  job('run', {
    title: '运行测试',
    async task(ctx, task) {
      const { args, printHelp } = parseArgs({
        'with-config': { short: 'c', arg: 'with-config', help: '指定lisa-btest.yml所在路径' },
        'task-help': { short: 'h', help: '打印帮助' },
      });

      if (args['task-help']) {
        return printHelp();
      }

      if (!await isLocalEnvironmentConfigured()) {
        throw new Error('环境没有初始化！请使用 lisa btest use-env {环境包名} 初始化一个环境。');
      }

      const path = workspace();
      const configPath = args['with-config'] ?? join(path, 'lisa-btest.yml');

      const project = await readProject(configPath);
      if (!project) {
        throw new Error(`该目录不是一个 lisa-btest 项目，或指定了无效的lisa-test.yml路径: ${configPath}\n` +
          '如果lisa-btest.yml位于其他路径，请使用 --with-config 参数指定。');
      }
      const commands = forceCast(project) as Record<`test_command:${typeof process.platform}`, string>;
      const test_command = commands[`test_command:${process.platform}`] ?? project.test_command;
      if (!test_command) {
        throw new Error(`未定义测试命令 'test_command'`);
      }

      const title = task.title;
      task.title = '';


      await execa.command(test_command, {
        stdio: 'inherit',
        env: await getEnv()
      });

      task.title = title;
    },
    options: {
      persistentOutput: true,
      bottomBar: Infinity,
    },
  });
}
