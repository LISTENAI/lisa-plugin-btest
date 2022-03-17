import { SerialPort } from 'serialport';
import { PortInfo } from '@serialport/bindings-interface';

export type Shell = PortInfo & { serialNumber: string };

export async function listShells(): Promise<Shell[]> {
  return (await SerialPort.list()).filter(({ serialNumber }) => !!serialNumber) as Shell[];
}
