import execa from 'execa';
import { resolve } from 'path';
import getEnv from './getEnv';

export interface Probe {
  unique_id: string;
  description: string;
  vendor_name: string;
  product_name: string;
}

const LIST_PROBE_PY = resolve(__dirname, '../../scripts/list_probe.py');

export async function listProbes(): Promise<Probe[]> {
  const { stdout } = await execa('python', [LIST_PROBE_PY], { env: await getEnv() });
  const probes = JSON.parse(stdout) as Probe[];
  return probes;
}

export async function generateDummyProbes(): Promise<Probe[]> {
  const result: Probe[] = [];
  result.push({
    unique_id: "000000000000000000000000000000000000000000000000",
    description: "dummy probe",
    vendor_name: "listenai",
    product_name: "dummy probe"
  });
  return result;
}


