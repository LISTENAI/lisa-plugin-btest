import pytest
from btest import device
from usb2xxx.usb_device import *
from usb2xxx.usb2gpio import *

GPIO_PIN_MAP = [
    # pad, csk_pin, usb_pin
    ('a', 4, 12),
    ('a', 5, 13),
    ('a', 6, 11),
    ('a', 7, 10),
    ('a', 8, 1),
    ('a', 9, 0),
    ('a', 15, 9),
    ('a', 16, 8),
    ('a', 17, 6),
    ('a', 18, 7),
    ('a', 19, 5),
    ('a', 20, 4),
]


@pytest.fixture
def connected_device():
    devices = device.load_devices('device-map.yml')
    assert len(devices) > 0

    usb = int(devices[0]['usb2xxx'])
    USB_OpenDevice(usb)

    shell = device.shell_open(devices[0]['shell'])

    yield (usb, shell)

    shell.close()
    USB_CloseDevice(usb)


def test_set_gpio(connected_device):
    (usb, shell) = connected_device
    for (pad, csk_pin, usb_pin) in GPIO_PIN_MAP:
        csk_bit = 1 << csk_pin
        usb_bit = 1 << usb_pin

        GPIO_SetInput(usb, usb_bit, 0)

        device.shell_cmd(shell, 'gpio', 'set', '%s %d %d' %
                         (pad, csk_bit, csk_bit), wait=True)

        read_bit = c_uint(0)
        GPIO_Read(usb, usb_bit, byref(read_bit))
        assert (read_bit.value & usb_bit) == usb_bit

        device.shell_cmd(shell, 'gpio', 'set', '%s %d 0' %
                         (pad, csk_bit), wait=True)

        read_bit = c_uint(0)
        GPIO_Read(usb, usb_bit, byref(read_bit))
        assert (read_bit.value & usb_bit) == 0


def test_get_gpio(connected_device):
    (usb, shell) = connected_device
    for [pad, csk_pin, usb_pin] in GPIO_PIN_MAP:
        csk_bit = 1 << csk_pin
        usb_bit = 1 << usb_pin

        GPIO_SetOutput(usb, usb_bit, 0)

        GPIO_Write(usb, usb_bit, usb_bit)

        read_bit = device.shell_cmd(shell, 'gpio', 'get', '%s %d' %
                                    (pad, csk_bit), wait=True)
        assert (read_bit & csk_bit) == csk_bit

        GPIO_Write(usb, usb_bit, 0)

        read_bit = device.shell_cmd(shell, 'gpio', 'get', '%s %d' %
                                    (pad, csk_bit), wait=True)
        assert (read_bit & csk_bit) == 0
