import pytest
import os
from btest import device
from btest.shell import *
from btest.utils import logfile

@pytest.fixture
def connected_device(request):
    # request = request.param
    # dm= './device-map.yml'

    try:
        dm = request.param
    except:
        dm= './device-map.yml'
    logs = './logs'
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

