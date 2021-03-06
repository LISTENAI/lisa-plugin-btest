import time
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


# def shell_cmd(shell, module, cmd, wait=False):
def shell_cmd(shell, cmd=True, wait=False):
    # _shell.shell_exec(shell, 'test_%s %s %s %s %s' % (module, cmd, *args))
    # _shell.Shell.exec(shell, 'test_%s %s %s %s %s %s' % (module, cmd, *args))
    if cmd:
        _shell.Shell.exec(shell, '%s' % (cmd))
    else:

        read= _shell.Shell.read(shell)  # 只读
        return read # 如果没有cmd传入，则只读，返回读到的文本
    if wait:
        # p = _shell.Shell.match(shell, 'pin_state:{}', full_match=True)
        if 'raw' in cmd:
            p = _shell.Shell.match(shell, 'pin_state:{}', full_match=True)

        else:
            p = _shell.Shell.match(shell, 'DONE:{}', full_match=True)  # 如果是非INPUT的用例获取DOne的值，否则获取pin_state的值
        return int(p[0])
    return 0
