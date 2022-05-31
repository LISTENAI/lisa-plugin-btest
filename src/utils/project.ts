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

export interface Device {
  probe: string;
  shell?: string;
  usb2xxx?: string;
}

/**
 * read device map from file
 * @param dir device map file path
 */
export async function readDeviceMap(dir: string): Promise<Device[]> {
  const path = dir;

  if (await pathExists(path)) {
    return load(await readFile(path, 'utf-8')) as Device[];
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
