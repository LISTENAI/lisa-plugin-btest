import { job } from '@listenai/lisa_core/lib/task';
import { CliUx } from '@oclif/core';
import chalk from 'chalk';
import UsbDevice from 'usb2xxx';

import { readDeviceMap } from '../utils/project';
import { listProbes, Probe } from '../utils/pyocd';
import { listShells, Shell } from '../utils/shell';
import workspace from '../utils/workspace';

export default () => {
  job('dm:show', {
    title: '显示设备映射',
    async task(ctx, task) {
      const path = workspace();

      const deviceMap = await readDeviceMap(path);
      if (deviceMap.length == 0) {
        throw new Error(`未定义设备映射 (device-map.yml)`);
      }

      const probes: Record<string, Probe> = {};
      for (const probe of await listProbes()) {
        probes[probe.unique_id] = probe;
      }

      const shells: Record<string, Shell> = {};
      for (const shell of await listShells()) {
        shells[shell.serialNumber] = shell;
      }

      const adapters = (await UsbDevice.scanDevice()).map(handle => `${handle}`);

      function formatItem(title: string, valid: boolean, description: () => string): string {
        if (valid) {
          return `${chalk.green(title)}\n${chalk.white(description())}`;
        } else {
          return `${chalk.red(title)}\n${chalk.gray('未连接')}`;
        }
      }

      const output = deviceMap.map(({ probe, shell, usb2xxx }) => ({
        probe: formatItem(probe, !!probes[probe], () => `${probes[probe].vendor_name} ${probes[probe].product_name}`),
        shell: formatItem(shell, !!shells[shell], () => `${shells[shell].path}`),
        usb2xxx: formatItem(usb2xxx, adapters.includes(usb2xxx), () => ''),
      }));

      task.title = '';
      CliUx.ux.table(output, {
        probe: { header: 'Probe' },
        shell: { header: 'Shell' },
        usb2xxx: { header: 'USB2XXX' },
      });
      console.log('');
    },
    options: {
      persistentOutput: true,
      bottomBar: Infinity,
    },
  });
}
