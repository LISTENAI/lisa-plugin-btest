import pytest
from btest import device
from btest.shell import *
from btest.utils import logfile


@pytest.fixture
def first_test():
    # Put your test case here
    assert true
