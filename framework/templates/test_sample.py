import pytest
from btest.conftest import connected_device,reset

# 请在此放入测试用例代码
# 所有测试用例文件名需要有"test_"前缀（比如：test_sample.py）
# Put your test-cases here
# all files with test case(s) SHOULD have a name started with "test_" (e.g. test_sample.py)

#@pytest.mark.usefixtures("reset")    #如果要在此类下的**所有测试用例**运行前都进行模组复位，请解除注释此装饰器。
                                      #Uncomment this decorator if hardware reset is needed before **EVERY test-cases** in this class.
class Test_Demo:
    #@pytest.mark.usefixtures("reset")      #如果**仅需在此测试用例**运行前进行模组复位，请解除注释此装饰器。
                                            #Uncomment this decorator if hardware reset is ONLY needed before **THIS test-case**.
    def test_match(self, connected_device):
        # 如果device-map.yml不在生成时的默认位置，请使用dm参数指定路径。
        # specify the path of "device-map.yml" in "dm" parameter if it is not in the default location when generated.
        (shell) = connected_device(dm= './device-map.yml')

        # 向串口中写入"demo"
        # Write "demo" into serial stream
        shell.exec("demo")

        # 进行手动模组复位
        # Do manual hardware reset
        shell.pyocd_reset()

        # 断言"test_version"关键字是否在10秒内(timeout参数指定)于输出日志中找到，如果没有找到，测试用例失败。
        # Assert if the keyword "test_version" could be found in output within 10 seconds (as specified in timeout), fail otherwise.
        assert shell.match("test_version", timeout = 10) is not None

    # 您可以像这样定义自己的测试用例。
    # You may define your own test case like this.
    def test_yourcase(self, connected_device):
        (shell) = connected_device(dm= './device-map.yml')
        # 您的测试用例代码
        # your custom code here
        assert True