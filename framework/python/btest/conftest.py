import pytest
from btest import device
from btest.shell import *
from btest.utils import logfile


@pytest.fixture
def connected_device(request):
    try:
        dm = request.param
    except AttributeError:
        dm = './device-map.yml'
    logs = './logs'
    devices = device.load_devices(dm)
    assert len(devices) > 0
    with logfile(logs, __name__) as f:
        this_shell = shell_open(devices[0]['shell'][0], log_to=f)
        yield this_shell
        this_shell.close()


@pytest.fixture(scope='function')
def reset(connected_device):
    (shell) = connected_device
    shell.pyocd_reset()
    yield
