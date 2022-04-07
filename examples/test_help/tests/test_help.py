import pytest
from btest import device
from btest.shell import *
import sys


@pytest.fixture
def connected_device():
    devices = device.load_devices('device-map.yml')
    assert len(devices) > 0
    shell = shell_open(devices[0]['shell'], log_to=sys.stdout)
    yield (shell)
    shell.close()


def test_help(connected_device):
    (shell) = connected_device
    shell.exec('help')
    assert shell.match('Available commands:',
                       full_match=True) is not None
    assert shell.match('Prints the help message.') is not None
