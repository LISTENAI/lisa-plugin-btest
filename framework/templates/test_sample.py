import pytest
from btest import device
from btest.shell import *
from btest.utils import logfile


@pytest.fixture
def connected_device():
    # set path of device-map.yml accordingly
    devices = device.load_devices('device-map.yml')
    assert len(devices) > 0
    with logfile('./logs', __name__) as f:
        shell = shell_open(devices[0]['shell'], log_to=f)
        yield (shell)
        shell.close()


def test_case_1(connected_device):
    # Put your test case here
    # all filename should be started with "test_" (e.g. test_sample.py)
    assert True
