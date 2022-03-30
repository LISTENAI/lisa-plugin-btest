from parse import parse
from ctypes import *
from pyocd.core.helpers import ConnectHelper
from serial import serial_for_url
from serial.tools import list_ports
from usb2xxx import usb_device
import yaml


def list_probes():
    return ConnectHelper.get_all_connected_probes(blocking=False, print_wait_message=False)


def list_shells():
    return list_ports.comports()


def list_usb2xxx():
    handles = (c_uint * 20)()
    ret = usb_device.USB_ScanDevice(byref(handles))
    return handles[:ret]


def load_device_map(file):
    with open(file, 'r') as f:
        return yaml.safe_load(f)


def load_devices(device_map):
    devices = load_device_map(device_map)
    probes = {p.unique_id for p in list_probes()}
    shells = {s.serial_number.lower()
              for s in list_shells() if s.serial_number}
    adapters = set(list_usb2xxx())
    return [
        {
            'probe': str(i['probe']),
            'shell': str(i['shell']),
            'usb2xxx': int(i['usb2xxx'])
        }
        for i in devices
        if i['probe'] in probes
        and i['shell'].lower() in shells
        and int(i['usb2xxx']) in adapters
    ]


def shell_open(id):
    shells = list_shells()
    for s in shells:
        if s.serial_number and s.serial_number.lower() == id.lower():
            port = serial_for_url(s.device)
            port.baudrate = 115200
            return port
    return None


def shell_cmd(shell, module, cmd, args, wait=False):
    shell.write(bytes("test_%s %s %s\n" %
                (module, cmd, args), encoding='utf-8'))
    if wait:
        while True:
            read = str(shell.readline(), 'utf-8').strip()
            if read.startswith('DONE:'):
                p = parse('DONE:{}', read)
                return int(p[0])
    return 0
