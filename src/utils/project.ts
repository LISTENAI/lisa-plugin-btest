import { pathExists, readFile } from 'fs-extra';
import { load } from 'js-yaml';
import { join } from 'path';

interface Project {
  board: string;
  test_command: string;
}

export async function readProject(dir: string): Promise<Project | undefined> {
  const path = join(dir, 'lisa-btest.yml');
  if (await pathExists(path)) {
    return load(await readFile(path, 'utf-8')) as Project;
  }
}

interface Device {
  probe: string;
  shell: string;
  usb2xxx: string;
}

export async function readDeviceMap(dir: string): Promise<Device[]> {
  const path = join(dir, 'device-map.yml');
  if (await pathExists(path)) {
    return load(await readFile(path, 'utf-8')) as Device[];
  } else {
    return [];
  }
}
