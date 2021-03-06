import time

from serial import serial_for_url
from serial.tools import list_ports
from parse import search, parse
import serial


def shell_list():
    return list_ports.comports()


def shell_open(id, baudrate=115200, log_to=None):
    shells = shell_list()
    
    for s in shells:
        if s.serial_number and s.serial_number.lower() == id.lower():
            port = serial_for_url(s.device)
            port.baudrate = baudrate
            port.parity = serial.PARITY_NONE
            port.timeout = 0.4
            port.stopbits = serial.STOPBITS_ONE
            port.bytesize = serial.EIGHTBITS
            return Shell(port, log_to=log_to)
    return None


class Shell:
    serial = None
    log_to = None

    def __init__(self, serial, log_to=None):
        self.serial = serial
        self.log_to = log_to

    def close(self):
        self.serial.close()

    def exec(self, cmd, end='\n'):
        print(cmd)
        self.serial.write(bytes('%s%s' % (cmd, end), encoding='utf-8'))
        self.serial.flush()

    def match(self, format, full_match=False, strip=True, timeout=10, debug=False):
        time_start = time.time()

        while True:
            r = str(self.serial.readline(), 'utf-8')
            if debug: print(f'串口日志: {r}')
            if self.log_to is not None:
                self.log_to.write(r)

            r = r.strip() if strip else r
            m = parse(format, r) if full_match else search(format, r)
            if m is not None:
                if debug: print(f'期望值已经找到: {m}')
                return m
            else:               # 若没找到则设置超时时间，到了超时时间未找到则退出
                if timeout != -1 and time.time() - time_start > timeout:
                    if debug: print('超时时间到了: ' + time.time() - time_start)
                    break
    

    def get_logfile(self, debug=False):
        while True:

            r = str(self.serial.readline(), 'utf-8')
            if r == '':
                break
            if debug: print(f'串口日志: {r}')
            if self.log_to is not None:
                self.log_to.write(r)


    def read(self, debug=False):
        text_str = ''
        for i in range(100):
            n = self.serial.inWaiting()
            if n:
                text_str += str(self.serial.readline(), 'utf-8')
                if debug: print(f'text_str的值为: {text_str}')
        return text_str