import { pathExists, readFile, outputFile } from 'fs-extra';
import { load, dump } from 'js-yaml';

export interface Project {
  board: string;
  test_command: string;
}

/**
 * read project config from path
 * @param dir lisa-btest.yml path
 */
export async function readProject(dir: string): Promise<Project | undefined> {
  const path = dir;

  if (await pathExists(path)) {
    return load(await readFile(path, 'utf-8')) as Project;
  }
}

interface DeviceV1 {
  probe: string;
  shell?: string;
  usb2xxx?: string | number;
}

export interface Device {
  probe: string;
  shell?: string[];
  usb2xxx?: string[];
}

/**
 * read device map from file
 * @param dir device map file path
 */
export async function readDeviceMap(dir: string): Promise<Device[]> {
  const path = dir;

  if (await pathExists(path)) {
    const devMapRawContent = await readFile(path, 'utf-8');
    let devices: Device[] = load(devMapRawContent) as Device[];
    if (devices.length > 0) {
      const item = devices[0];
      if ((item.shell && !Array.isArray(item.shell)) || (item.usb2xxx && !Array.isArray(item.usb2xxx))) {
        const convertedDevices: Device[] = [];
        const oldDevices: DeviceV1[] = load(devMapRawContent) as DeviceV1[];
        for (const oldDevice of oldDevices) {
          const newDeviceItem: Device = {
            probe: oldDevice.probe,
            shell: oldDevice.shell ? [ oldDevice.shell ] : undefined,
            usb2xxx: oldDevice.usb2xxx ? [ oldDevice.usb2xxx.toString() ] : undefined
          };
          convertedDevices.push(newDeviceItem);
        }
        devices = convertedDevices;
      }
    }
    return devices;
  } else {
    return [];
  }
}

/**
 * write device map to file
 * @param dir destination path
 * @param deviceMap device map
 */
export async function writeDeviceMap(dir: string, deviceMap: Device[]): Promise<void> {
  const path = dir;
  await outputFile(path, dump(deviceMap));
}
