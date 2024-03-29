import { job } from '@listenai/lisa_core/lib/task';
import { CliUx } from '@oclif/core';
import { prompt } from 'inquirer';
import chalk from 'chalk';
import UsbDevice from 'usb2xxx';

import { readDeviceMap, Device, writeDeviceMap } from '../utils/project';
import { generateDummyProbes, listProbes, Probe } from '../utils/pyocd';
import { listShells, Shell } from '../utils/shell';
import workspace from '../utils/workspace';
import parseArgs from "../utils/parseArgs";
import {join, resolve} from "path";
import {getLocalEnvironment, isLocalEnvironmentConfigured} from "../utils/framework";
import getEnv from "../utils/getEnv";

export default () => {
  job('dm:show', {
    title: '显示设备映射',
    async task(ctx, task) {
      const { args, printHelp } = parseArgs({
        'with-device-map': { short: 'd', arg: 'output', help: '指定device-map.yml所在路径' },
        'task-help': { short: 'h', help: '打印帮助' },
      });

      if (args['task-help']) {
        return printHelp();
      }

      if (!await isLocalEnvironmentConfigured()) {
        throw new Error('环境没有初始化！请使用 lisa btest use-env {环境包名} 初始化一个环境。');
      }
      const path = resolve(args['with-device-map'] ?? join(workspace(), 'device-map.yml'));

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

      const { args, printHelp } = parseArgs({
        'output': { short: 'd', arg: 'output', help: '指定device-map.yml所在路径' },
        'task-help': { short: 'h', help: '打印帮助' },
      });

      if (args['task-help']) {
        return printHelp();
      }

      if (!await isLocalEnvironmentConfigured()) {
        throw new Error('环境没有初始化！请使用 lisa btest use-env {环境包名} 初始化一个环境。');
      }
      const path = resolve(args['output'] ?? join(workspace(), 'device-map.yml'));

      const deviceMap = await readDeviceMap(path);
      if (deviceMap.length > 0) {
        const { overwrite } = await prompt([{
          type: 'confirm',
          name: 'overwrite',
          message: `${path} 已存在，要覆盖它吗？`,
          default: false,
        }]);

        if (!overwrite) {
          console.log('');
          return;
        }
      }

      const newMap: Device[] = [];

      let probes = await getProbeMap();
      if (Object.keys(probes).length == 0) {
        console.log(`没有找到已连接的调试器，已加入模拟调试器！`);
        console.log(`如果确定接入了真实设备，请按 Ctrl + C 后重新插拔设备再试！`);
        for (const probe of await generateDummyProbes()) {
          probes[probe.unique_id] = probe;
        }
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
                name: `${shells[shell].path} (${shells[shell].vendorId}:${shells[shell].productId} ${shells[shell].manufacturer})`,
                value: shell,
              })),
            }]);
            if (!device.shell) {
              device.shell = [];
            }
            if (device.shell.includes(shell)) {
              continue;
            }
            device.shell.push(shell);
          } else if (action == 'usb2xxx') {
            const { usb2xxx } = await prompt([{
              type: 'list',
              name: 'usb2xxx',
              message: `选择调试器所对应的 USB2XXX 设备`,
              choices: Object.keys(adapters),
            }]);
            if (!device.usb2xxx) {
              device.usb2xxx = [];
            }
            if (device.usb2xxx.includes(usb2xxx)) {
              continue;
            }
            device.usb2xxx.push(usb2xxx);
          }
        }
        newMap.push(device);
      }

      await printMapTable(newMap);
      const { save } = await prompt([{
        type: 'confirm',
        name: 'save',
        message: `要将上述结果保存到 ${path} 吗？`,
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
    shells[shell.path] = shell;
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

  function formatArray(assignedItems: string[], validItems: Record<string, any>, arrayType: string): string {
    let result: string[] = [];
    for (const assignedItem of assignedItems) {
      const isValid: boolean = !!validItems[assignedItem];
      let desc: string = "";
      switch (arrayType) {
        case "shell":
          const thisValidItem = validItems[assignedItem];
          desc = `${thisValidItem.vendorId}:${thisValidItem.productId} (${thisValidItem.manufacturer})`;
          break;
        default:
          break;
      }

      const itemResult: string = formatItem(assignedItem, isValid, () => desc);
      result.push(itemResult);
    }

    return result.join('\n');
  }

  const probes = await getProbeMap();
  const shells = await getShellMap();
  const adapters = await getAdapterMap();

  const output = deviceMap.map(({ probe, shell, usb2xxx }) => ({
    probe: formatItem(probe, !!probes[probe], () => `${probes[probe].vendor_name} ${probes[probe].product_name}`),
    shell: shell && shell.length > 0 ? formatArray(shell, shells, "shell") : chalk.gray('未绑定'),
    usb2xxx: usb2xxx && usb2xxx.length > 0 ? formatArray(usb2xxx, adapters, "usb2xxx") : chalk.gray('未绑定'),
  }));

  CliUx.ux.table(output, {
    probe: { header: 'Probe' },
    shell: { header: 'Shell' },
    usb2xxx: { header: 'USB2XXX' },
  });
}
