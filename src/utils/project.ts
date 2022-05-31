import { pathExists, readFile, outputFile } from 'fs-extra';
import { load, dump } from 'js-yaml';
import { join, resolve } from 'path';
import { lstatSync } from 'fs';

export interface Project {
  board: string;
  test_command: string;
}

export async function readProject(dir: string): Promise<Project | undefined> {
  const path = lstatSync(dir).isDirectory() ? join(dir, 'lisa-btest.yml') : dir;

  if (await pathExists(path)) {
    return load(await readFile(path, 'utf-8')) as Project;
  }
}

export interface Device {
  probe: string;
  shell?: string;
  usb2xxx?: string;
}

export async function readDeviceMap(dir: string): Promise<Device[]> {
  const path = lstatSync(dir).isDirectory() ? join(dir, 'device-map.yml') : dir;

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
