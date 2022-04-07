from serial import serial_for_url
from serial.tools import list_ports
from parse import search, parse


def shell_list():
    return list_ports.comports()


def shell_open(id, baudrate=115200, log_to=None):
    shells = shell_list()
    for s in shells:
        if s.serial_number and s.serial_number.lower() == id.lower():
            port = serial_for_url(s.device)
            port.baudrate = baudrate
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

    def exec(self, cmd):
        self.serial.write(bytes('%s\n' % cmd, encoding='utf-8'))
        self.serial.flush()

    def match(self, format, full_match=False, strip=True):
        while True:
            r = str(self.serial.readline(), 'utf-8')
            if self.log_to is not None:
                self.log_to.write(r)
            r = r.strip() if strip else r
            m = parse(format, r) if full_match else search(format, r)
            if m is not None:
                return m
