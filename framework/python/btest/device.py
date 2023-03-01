import time
from ctypes import *
from pyocd.core.helpers import ConnectHelper
from usb2xxx import usb_device
from . import shell as _shell
import yaml
import subprocess


def pyocd_reset(cmd="python -m pyocd reset -m hw", timeout=10, delayed=0):
    """
    Execute command on local machine
    :param cmd:
    :return:
    """
    print("**********************************")
    print('Execute command ' + cmd + ' now')
    print("**********************************")
    pro = subprocess.Popen(cmd, bufsize=10000, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, shell=True)
    result_str = ''
    curline = pro.stdout.readline().decode('utf-8')
    time_start = time.time()
    while curline != '':
        time_end = time.time()
        time_cha = time_end - time_start
        result_str += curline
        curline = pro.stdout.readline().decode('utf-8')
        if time_cha > timeout:
            break
    pro.wait()
    _shell.Shell.flushInput()
    _shell.Shell.flushOutput()
    time.sleep(delayed)
    return result_str


def list_probes():
    return ConnectHelper.get_all_connected_probes(blocking=False, print_wait_message=False)


def list_shells():
    return _shell.shell_list()


def list_usb2xxx():
    handles = (c_uint * 20)()
    ret = usb_device.USB_ScanDevice(byref(handles))
    return handles[:ret]


def load_device_map(file):
    result = []

    with open(file, 'r') as f:
        this_yaml = yaml.safe_load(f)
        for item in this_yaml:
            this_item = {}
            #probe
            this_item['probe'] = item['probe']
            #shell
            if item.get('shell') is not None:
                if type(item['shell']) is list:
                    this_item['shell'] = item['shell']
                else:
                    this_item['shell'] = {}
                    this_item['shell'][0] = item['shell']
            #usb2xxx
            if item.get('usb2xxx') is not None:
                if type(item['usb2xxx']) is list:
                    this_item['usb2xxx'] = item['usb2xxx']
                else:
                    this_item['usb2xxx'] = {}
                    this_item['usb2xxx'][0] = item['usb2xxx']

            result.append(this_item)
    
    return result

def load_devices(device_map):
    devices = load_device_map(device_map)
    probes = {p.unique_id for p in list_probes()}
    return [i for i in devices if i['probe'] in probes]


def shell_open(id, baudrate=115200):
    return _shell.shell_open(id, baudrate)


def shell_cmd(shell, cmd=True, wait=False):
    if cmd:
        _shell.Shell.exec(shell, '%s' % (cmd))
    else:
        read = _shell.Shell.read(shell)  # 只读
        return read  # 如果没有cmd传入，则只读，返回读到的文本
    if wait:
        if 'raw' in cmd:
            p = _shell.Shell.match(shell, 'pin_state: {}', False, True, 10)
        else:
            p = _shell.Shell.match(shell, 'DONE:{}', False, True, 10)  # 如果是非INPUT的用例获取DOne的值，否则获取pin_state的值
        return int(p[0][0])

    # return 0
