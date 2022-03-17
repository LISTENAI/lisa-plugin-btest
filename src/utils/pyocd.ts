import execa from 'execa';
import getEnv from './getEnv';

export interface Probe {
  unique_id: string;
  info: string;
  board_name: string;
  target: string;
  vendor_name: string;
  product_name: string;
}

export async function listProbes(): Promise<Probe[]> {
  const { stdout } = await execa('pyocd', ['json', '-p'], { env: await getEnv() });
  const { boards: probes } = JSON.parse(stdout) as { boards: Probe[] };
  return probes;
}
