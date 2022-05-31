import { pathExists, readFile, outputFile } from 'fs-extra';
import { load, dump } from 'js-yaml';
import { join, resolve } from 'path';

export interface Project {
  board: string;
  test_command: string;
}

export async function readProject(dir: string, configPath?: string): Promise<Project | undefined> {
  let path = typeof configPath !== 'undefined' ?
      resolve(configPath) : join(dir, 'lisa-btest.yml');

  if (await pathExists(path)) {
    return load(await readFile(path, 'utf-8')) as Project;
  }
}

export interface Device {
  probe: string;
  shell?: string;
  usb2xxx?: string;
}

export async function readDeviceMap(dir: string, devMapPath?: string): Promise<Device[]> {
  let path = typeof devMapPath !== 'undefined' ?
      resolve(devMapPath) : join(dir, 'device-map.yml');

  if (await pathExists(path)) {
    return load(await readFile(path, 'utf-8')) as Device[];
  } else {
    return [];
  }
}

export async function writeDeviceMap(dir: string, deviceMap: Device[]): Promise<void> {
  const path = join(dir, 'device-map.yml');
  await outputFile(path, dump(deviceMap));
}
