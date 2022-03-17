import { job } from '@listenai/lisa_core/lib/task';
import execa from 'execa';

import extendExec from '../utils/extendExec';
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

      await execa(project.test_command, {
        stdio: 'inherit',
      });

      task.title = title;
    },
    options: {
      persistentOutput: true,
      bottomBar: Infinity,
    },
  });
}
