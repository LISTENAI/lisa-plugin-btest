import { job } from '@listenai/lisa_core/lib/task';
import { SerialPort } from 'serialport';
import UsbDevice from 'usb2xxx';

export default () => {
  job('list:serial', {
    title: '列出可用的串口设备',
    async task(ctx, task) {
      const ports = (await SerialPort.list()).filter(port => port.serialNumber);
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
