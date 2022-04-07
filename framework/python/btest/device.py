from ctypes import *
from pyocd.core.helpers import ConnectHelper
from usb2xxx import usb_device
from . import shell as _shell
import yaml


def list_probes():
    return ConnectHelper.get_all_connected_probes(blocking=False, print_wait_message=False)


def list_shells():
    return _shell.shell_list()


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
    return [i for i in devices if i['probe'] in probes]


def shell_open(id, baudrate=115200):
    return _shell.shell_open(id, baudrate)


def shell_cmd(shell, module, cmd, args, wait=False):
    _shell.shell_exec(shell, 'test_%s %s %s' % (module, cmd, args))
    if wait:
        p = _shell.shell_match(shell, 'DONE:{}', full_match=True)
        return int(p[0])
    return 0
