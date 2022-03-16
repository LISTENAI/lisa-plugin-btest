import { job } from '@listenai/lisa_core/lib/task';
import { join } from 'path';

import extendExec from '../utils/extendExec';
import workspace from '../utils/workspace';

export default () => {
  job('proj:build', {
    title: '构建测试固件',
    async task(ctx, task) {
      const exec = extendExec({ task });
      await exec('lisa', [
        'zep', 'build',
        '-b', 'csk6001_tester',
        join(workspace(), 'firmware'),
      ]);
    },
    options: {
      bottomBar: 5,
    },
  });
}
