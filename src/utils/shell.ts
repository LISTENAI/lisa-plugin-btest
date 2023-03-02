import { SerialPort } from 'serialport';
import { PortInfo } from '@serialport/bindings-interface';

export type Shell = PortInfo & { serialNumber: string };

export async function listShells(): Promise<Shell[]> {
  return (await SerialPort.list()).filter(({ path }) => path.toLowerCase().startsWith('com') ||
                                                        path.toLowerCase().startsWith("/dev/ttyacm") ||
                                                        path.toLowerCase().startsWith('/dev/ttyusb') ||
                                                        path.toLowerCase().startsWith('/dev/cu')) as Shell[];
}
