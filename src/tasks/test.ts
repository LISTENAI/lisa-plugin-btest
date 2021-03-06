import { job } from '@listenai/lisa_core/lib/task';
import execa from 'execa';
import { join } from 'path';

import { FRAMEWORK_DIR } from '../const';
import { alterPathFromEnv } from '../utils/path';
import { readProject } from '../utils/project';
import { forceCast } from '../utils/typing';
import workspace from '../utils/workspace';

export default () => {
  job('run', {
    title: '运行测试',
    async task(ctx, task) {
      const path = workspace();

      const project = await readProject(path);
      if (!project) {
        throw new Error(`该目录不是一个 lisa-btest 项目: ${path}`);
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
        env: {
          ...alterPathFromEnv('PYTHONPATH', join(FRAMEWORK_DIR, 'python')),
        },
      });

      task.title = title;
    },
    options: {
      persistentOutput: true,
      bottomBar: Infinity,
    },
  });
}
