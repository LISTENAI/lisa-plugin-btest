import { job } from '@listenai/lisa_core/lib/task';
import { CliUx } from '@oclif/core';
import { prompt } from 'inquirer';
import chalk from 'chalk';
import UsbDevice from 'usb2xxx';

import { readDeviceMap, Device, writeDeviceMap } from '../utils/project';
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

      task.title = '';
      await printMapTable(deviceMap);
      console.log('');
    },
    options: {
      persistentOutput: true,
      bottomBar: Infinity,
    },
  });

  job('dm:init', {
    title: '生成设备映射',
    async task(ctx, task) {
      task.title = '';

      const path = workspace();

      const deviceMap = await readDeviceMap(path);
      if (deviceMap.length > 0) {
        const { overwrite } = await prompt([{
          type: 'confirm',
          name: 'overwrite',
          message: 'device-map.yml 已存在，要覆盖它吗？',
          default: false,
        }]);

        if (!overwrite) {
          console.log('');
          return;
        }
      }

      const newMap: Device[] = [];

      const probes = await getProbeMap();
      if (Object.keys(probes).length == 0) {
        throw new Error(`没有找到已连接的调试器`);
      }

      const shells = await getShellMap();
      const adapters = await getAdapterMap();

      for (const probe of Object.keys(probes)) {
        const device: Device = { probe };
        while (true) {
          let { action } = await prompt([{
            type: 'list',
            name: 'action',
            message: `为调试器 ${probes[probe].vendor_name} ${probes[probe].product_name} (${probes[probe].unique_id}) 配置设备映射`,
            choices: [
              { name: '绑定一个 Shell', value: 'shell' },
              { name: '绑定一个 USB2XXX', value: 'usb2xxx' },
              { name: '完成', value: undefined },
            ],
          }]);
          if (!action) break;

          if (action == 'shell') {
            const { shell } = await prompt([{
              type: 'list',
              name: 'shell',
              message: `选择调试器所对应的 Shell 设备`,
              choices: Object.keys(shells).map((shell) => ({
                name: `${shells[shell].path} (${shell})`,
                value: shell,
              })),
            }]);
            device.shell = shell;
          } else if (action == 'usb2xxx') {
            const { usb2xxx } = await prompt([{
              type: 'list',
              name: 'usb2xxx',
              message: `选择调试器所对应的 USB2XXX 设备`,
              choices: Object.keys(adapters),
            }]);
            device.usb2xxx = usb2xxx;
          }

          if (device.shell && device.usb2xxx) break;
        }
        newMap.push(device);
      }

      await printMapTable(newMap);
      const { save } = await prompt([{
        type: 'confirm',
        name: 'save',
        message: '要将上述结果保存到 device-map.yml 吗？',
        default: true,
      }]);
      if (save) {
        await writeDeviceMap(path, newMap);
      }

      console.log('');
    },
  });
}

async function getProbeMap(): Promise<Record<string, Probe>> {
  const probes: Record<string, Probe> = {};
  for (const probe of await listProbes()) {
    probes[probe.unique_id] = probe;
  }
  return probes;
}

async function getShellMap(): Promise<Record<string, Shell>> {
  const shells: Record<string, Shell> = {};
  for (const shell of await listShells()) {
    shells[shell.serialNumber] = shell;
  }
  return shells;
}

async function getAdapterMap(): Promise<Record<string, number>> {
  const adapters: Record<string, number> = {};
  for (const handle of await UsbDevice.scanDevice()) {
    adapters[`${handle}`] = handle;
  }
  return adapters;
}

async function printMapTable(deviceMap: Device[]): Promise<void> {
  function formatItem(title: string, valid: boolean, description: () => string): string {
    if (valid) {
      return `${chalk.green(title)}\n${chalk.white(description())}`;
    } else {
      return `${chalk.red(title)}\n${chalk.gray('未连接')}`;
    }
  }

  const probes = await getProbeMap();
  const shells = await getShellMap();
  const adapters = await getAdapterMap();

  const output = deviceMap.map(({ probe, shell, usb2xxx }) => ({
    probe: formatItem(probe, !!probes[probe], () => `${probes[probe].vendor_name} ${probes[probe].product_name}`),
    shell: shell ? formatItem(shell, !!shells[shell], () => `${shells[shell].path}`) : chalk.gray('未绑定'),
    usb2xxx: usb2xxx ? formatItem(usb2xxx, !!adapters[usb2xxx], () => '') : chalk.gray('未绑定'),
  }));

  CliUx.ux.table(output, {
    probe: { header: 'Probe' },
    shell: { header: 'Shell' },
    usb2xxx: { header: 'USB2XXX' },
  });
}
