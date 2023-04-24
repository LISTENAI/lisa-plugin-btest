import { job } from '@listenai/lisa_core/lib/task';
import UsbDevice from 'usb2xxx';

import { listProbes } from '../utils/pyocd';
import { listShells } from '../utils/shell';
import {isLocalEnvironmentConfigured} from "../utils/framework";

export default () => {
  job('list:probe', {
    title: '列出可用的调试器',
    async task(ctx, task) {
      if (!await isLocalEnvironmentConfigured()) {
        throw new Error('环境没有初始化！请使用 lisa btest use-env {环境包名} 初始化一个环境。');
      }

      const probes = await listProbes();
      task.title = '';
      for (let i = 0; i < probes.length; i++) {
        task.output = `设备 ${i}: ${probes[i].unique_id} (${probes[i].vendor_name} ${probes[i].product_name})`;
      }
    },
    options: {
      persistentOutput: true,
      bottomBar: Infinity,
    },
  });

  job('list:shell', {
    title: '列出可用的串口设备',
    async task(ctx, task) {
      if (!await isLocalEnvironmentConfigured()) {
        throw new Error('环境没有初始化！请使用 lisa btest use-env {环境包名} 初始化一个环境。');
      }

      const ports = await listShells();
      task.title = '';
      for (let i = 0; i < ports.length; i++) {
        task.output = `设备 ${i}: ${ports[i].serialNumber} (路径: ${ports[i].path})`
      }
    },
    options: {
      persistentOutput: true,
      bottomBar: Infinity,
    },
  });

  job('list:usb2xxx', {
    title: '列出可用的 USB2XXX 设备',
    async task(ctx, task) {
      if (!await isLocalEnvironmentConfigured()) {
        throw new Error('环境没有初始化！请使用 lisa btest use-env {环境包名} 初始化一个环境。');
      }

      const handles = await UsbDevice.scanDevice();
      task.title = '';
      for (let i = 0; i < handles.length; i++) {
        task.output = `设备 ${i}: ${handles[i]}`
      }
    },
    options: {
      persistentOutput: true,
      bottomBar: Infinity,
    },
  });
}
