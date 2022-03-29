import hid from 'node-hid';

export interface Probe {
  unique_id: string;
  vendor_name: string;
  product_name: string;
}

const USB_VID_NXP = 0x0d28;

export async function listProbes(): Promise<Probe[]> {
  return hid.devices()
    .filter(({ vendorId, serialNumber }) => vendorId == USB_VID_NXP && serialNumber)
    .map((device) => ({
      unique_id: device.serialNumber!,
      vendor_name: device.manufacturer || '',
      product_name: device.product || '',
    }));
}
