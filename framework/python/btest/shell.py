from serial import serial_for_url
from serial.tools import list_ports
from parse import search, parse


def shell_list():
    return list_ports.comports()


def shell_open(id, baudrate=115200):
    shells = shell_list()
    for s in shells:
        if s.serial_number and s.serial_number.lower() == id.lower():
            port = serial_for_url(s.device)
            port.baudrate = baudrate
            return Shell(port)
    return None


class Shell:
    serial = None

    def __init__(self, serial):
        self.serial = serial

    def close(self):
        self.serial.close()

    def exec(self, cmd):
        self.serial.write(bytes('%s\n' % cmd, encoding='utf-8'))
        self.serial.flush()

    def match(self, format, full_match=False, strip=True):
        while True:
            r = str(self.serial.readline(), 'utf-8')
            r = r.strip() if strip else r
            m = parse(format, r) if full_match else search(format, r)
            if m is not None:
                return m
