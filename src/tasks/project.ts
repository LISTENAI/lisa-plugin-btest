import { job } from '@listenai/lisa_core/lib/task';
import { join } from 'path';

import extendExec from '../utils/extendExec';
import parseArgs from '../utils/parseArgs';
import { readDeviceMap, readProject } from '../utils/project';
import { listProbes } from '../utils/cmsis-dap';
import workspace from '../utils/workspace';

export default () => {
  job('proj:build', {
    title: '构建测试固件',
    async task(ctx, task) {
      const path = workspace();

      const project = await readProject(path);
      if (!project) {
        throw new Error(`该目录不是一个 lisa-btest 项目: ${path}`);
      }
      if (!project.board) {
        throw new Error(`未定义板型 'board'`);
      }

      const exec = extendExec({ task });
      await exec('lisa', ['zep', 'build', '-b', project.board, join(path, 'firmware')], {
        env: {
          CMAKE_EXPORT_COMPILE_COMMANDS: '1',
        },
      });
    },
    options: {
      bottomBar: 5,
    },
  });

  job('proj:flash', {
    title: '烧录测试固件',
    async task(ctx, task) {
      const { args, printHelp } = parseArgs({
        'probe': { short: 'p', arg: 'id', help: '指定烧录所用调试器 (使用逗号 "," 间隔，缺省烧录 device-map.yml 中已定义且已连接的全部调试器)' },
        'task-help': { short: 'h', help: '打印帮助' },
      });
      if (args['task-help']) {
        return printHelp();
      }

      const path = workspace();

      const definedProbes = (await readDeviceMap(path)).map(({ probe }) => probe);
      if (definedProbes.length == 0) {
        throw new Error(`未定义设备映射 (device-map.yml)`);
      }

      const connectedProbes = (await listProbes()).map(({ unique_id }) => unique_id);

      const flashProbes: string[] = [];
      if (args.probe) {
        for (const probe of args.probe.split(',')) {
          if (definedProbes.includes(probe) && connectedProbes.includes(probe)) {
            flashProbes.push(probe);
          }
        }
      } else {
        for (const probe of connectedProbes) {
          if (definedProbes.includes(probe)) {
            flashProbes.push(probe);
          }
        }
      }
      if (flashProbes.length == 0) {
        throw new Error(`未找到已连接且已在 device-map.yml 中定义的调试器`);
      }

      const exec = extendExec({ task });
      for (const probe of flashProbes) {
        await exec('lisa', ['zep', 'flash', '-r', 'pyocd', `--flash-opt=-u=${probe}`]);
      }
    },
    options: {
      bottomBar: 5,
    },
  });
}
