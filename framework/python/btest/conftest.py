import pytest
import os
from btest import device
from btest.shell import *
from btest.utils import logfile

@pytest.fixture
def connected_device(dm= './device-map.yml',logs = './logs'):
    # set path of device-map.yml accordingly
    devices = device.load_devices(dm)
    assert len(devices) > 0
    with logfile(logs, __name__) as f:
        shellb = shell_open(devices[0]['shell'], log_to=f)
        yield (shellb)
        shellb.close()

@pytest.fixture(scope='function')
def reset(connected_device):
    (shell) = connected_device
    shell.pyocd_reset()
    yield

