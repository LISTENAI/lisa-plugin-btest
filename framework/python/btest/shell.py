import time
from serial import serial_for_url
from serial.tools import list_ports
from parse import search, parse
import serial
import subprocess
from . import out_put_color as print_color 
import binascii
import platform

platform_bool =False
if(platform.system()=="Windows"):
    platform_bool=True


def shell_list():
    return list_ports.comports()


def shell_open(id, baudrate=115200, log_to=None):
    shells = shell_list()
    is_port_number = id.lower().startswith("com") or id.lower().startswith("/dev/tty") or id.lower().startswith(
        "/dev/cu.")
    for s in shells:
        port = None
        if is_port_number:
            if s.device and s.device.lower() == id.lower():
                port = serial_for_url(s.device)
        else:
            if s.serial_number and s.serial_number.lower() == id.lower():
                port = serial_for_url(s.device)
        if port is None:
            continue
        port.baudrate = baudrate
        port.parity = serial.PARITY_NONE
        port.timeout = 0.4
        port.stopbits = serial.STOPBITS_ONE
        port.bytesize = serial.EIGHTBITS
        if  platform_bool:
            port.set_buffer_size(rx_size = 1000000,tx_size = 1000000)
        return Shell(port, log_to=log_to)

    return None


class Shell:
    serial = None
    log_to = None
    def __init__(self, serial, log_to=None):
        self.serial = serial
        self.log_to = log_to
        self.color = print_color.output_color()

    def close(self):
        self.serial.close()

    def exec(self, cmd, end='\n'):
        self.serial.write(bytes('%s%s' % (cmd, end), encoding='utf-8'))
        self.flush()
        # time.sleep(0.2)
        print(f'发送串口协议: {self.color.cyan(cmd)}')


    def exec_fromhex(self, cmd):
        self.serial.write(bytes.fromhex(cmd))
        self.flush()
        # time.sleep(0.2)
        print(f'发送串口协议: {self.color.cyan(cmd)}')

    def match(self, format=str, full_match=False, strip=True, timeout=10, debug=False):
        time_start = time.time()
        while True:
            time_end = time.time()
            time_cha = time_end - time_start
            r = str(self.serial.readline(), 'utf-8', 'ignore')
            if debug:
                print(f'Serial log: {r}')

            if self.log_to is not None:
                self.log_to.write(r)
            r = r.strip() if strip else r
            m = parse(format, r) if full_match else search(format, r)
            if m is not None:
                if debug: print(f'期望值已经找到: {self.color.dave(format)}')
                print(f'find logfile spend {time_cha}')
                return m,time_cha
            else:               # 若没找到则设置超时时间，到了超时时间未找到则退出
            	if timeout != -1 and time_cha > timeout:
                	if debug: print('超时时间到了: ' + str(time.time() - time_start))
                	break       
                
                     
    def match_fromhex(self, format=str, full_match =False, strip=True,timeout = 10):
        time_start = time.time()
        while True:
            time_end =time.time()
            time_cha = time_end-time_start
            r1 = self.serial.readline()
        
            r = str(binascii.b2a_hex(r1), encoding='utf-8').upper()
            

            if self.log_to is not None:
                self.log_to.write(r)
            r = r.strip() if strip else r
            m = parse(format, r) if full_match else search(format, r)
            if m is not None:
                
                print(f'result_found{m}')
                print(f'find logfile spend {time_cha}')
                return m,time_cha
                
            if time_cha > timeout:
                print('time_out_up')
                break

    def get_logfile(self, debug=False):
        while True:

            r = str(self.serial.readline(), 'utf-8')
            if r == '':
                break
            if debug:
                print(f'串口日志: {r}')
            if self.log_to is not None:
                self.log_to.write(r)

    def read(self, strip=True):
        text_str = ''
        for i in range(10000):
            n = self.serial.inWaiting()
            if n:
                text_str += str(self.serial.read(n), 'utf-8', 'ignore')
                # print(f'text_str_value {text_str}')
            else:
                break
        return text_str
        
    def read_hex(self):
        text_str = self.serial.read_all()
        return text_str
    def flush(self):
        self.serial.flush()

    def flushInput(self):
        self.serial.flushInput()

    def flushOutput(self):
        self.serial.flushOutput()

    def pyocd_reset(self, cmd="python -m pyocd reset -m hw", timeout=10, delayed=0):
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
        curline = pro.stdout.readline().decode('gbk')
        time_start = time.time()
        while curline != '':
            time_end = time.time()
            time_cha = time_end - time_start
            result_str += curline
            curline = pro.stdout.readline().decode('gbk')
            if time_cha > timeout:
                break
        pro.wait()
        self.flushInput()
        self.flushOutput()
        time.sleep(delayed)
        return result_str

    def read_match(self, start_format=str, end_format=str, timeout=10):
        text_str = ''
        time_start = time.time()
        while True:
            time_end = time.time()
            time_cha = time_end - time_start
            n = self.serial.inWaiting()
            if n:
                text_str = str(self.serial.read(n), 'utf-8', 'ignore')
                if end_format in text_str:
                    break
            if time_cha > timeout:
                print('time_out')
                break
            time.sleep(0.002)
        c = text_str.split(start_format)[1]
        text_cut_out_str = c.split(end_format)[0]
        return text_str, text_cut_out_str
