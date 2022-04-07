import { job } from '@listenai/lisa_core/lib/task';
import execa from 'execa';
import { join } from 'path';

import { FRAMEWORK_DIR } from '../const';
import { alterPathFromEnv } from '../utils/path';
import { readProject } from '../utils/project';
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
      if (!project.test_command) {
        throw new Error(`未定义测试命令 'test_command'`);
      }

      const title = task.title;
      task.title = '';

      await execa.command(project.test_command, {
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
