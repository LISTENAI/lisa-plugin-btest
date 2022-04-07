LISA B-Test Plugin [![test](https://github.com/LISTENAI/lisa-plugin-btest/actions/workflows/push.yml/badge.svg)](https://github.com/LISTENAI/lisa-plugin-btest/actions/workflows/push.yml)
==========

[![lpm-img]][lpm-url] [![issues][issues-img]][issues-url] [![stars][stars-img]][stars-url] [![commits][commits-img]][commits-url]

## 安装

```sh
lisa install -g @lisa-plugin/btest
```

### 系统要求

* [Node 16](https://nodejs.org/en/download/)
* [Python 3.9](https://www.python.org/downloads/)
* [LISA 及 LISA Zephyr Plugin](https://docs.listenai.com/chips/600X/quick_start/installation)

除此之外，各个平台的额外需求：

#### Windows

* Windows 10 或以上，x86_64 或 ARM

#### Linux

* Ubuntu 20.04 (建议)

#### macOS

* macOS 11 (Big Sur) 或以上，Intel 或 Apple Silicon

## 概述

LISA B-Test 是一套用于对硬件进行行为测试的工作流。它基于业界常用测试框架 (目前支持 pytest)，利用 shell 调起测试固件中的对应功能，对固件的输出行为进行断言。

![](doc/test-flow.png)

待测硬件与调试器 (目前支持 DAPLink) 二者组成了一个最小的测试套件。调试器同时承担了程序烧录与串口 shell 的功能。

可选地，本框架还支持关联外部适配器 (目前支持 [USB2XXX](http://www.toomoss.com/product/1-cn.html)) 读取待测硬件的输出信号，针对输出电平进行断言。

在一台主机上可同时接入多套测试套件，用于运行不同的测试工程。测试工程目录下的 `device-map.yml` 记录了测试工程与测试套件、套件中待测硬件、调试器、适配器的对应关系。可通过 `lisa btest dm:show` 显示，也可通过 `lisa btest dm:init` 生成。

## 工程结构

一个最简化的测试工程可参照 [examples/test_help](examples/test_help/)。该工程结构如下：

```
|- tests              测试用例，是一个标准的 pytest 项目
|- device-map.yml     测试设备映射，通过 lisa btest dm:init 生成
\- lisa-btest.yml     测试工程配置
```

其中 `lisa-btest.yml` 示例如下：

```yml
test_command: pytest    # 测试命令，如使用 pytest 则是 pytest
```

该工程假定你的设备已经烧录了待测固件，通过 `lisa btest run` 即可运行测试。

此外，在某些更复杂的测试场景下，你可能需要编写额外的测试固件。你可以参照 [examples/test_gpio](examples/test_gpio/) 将固件源码也放到测试工程里维护。结构如下：

```
|- firmware           测试固件，是一个标准的 Zephyr App 项目
|- tests              测试用例，是一个标准的 pytest 项目
|- device-map.yml     测试设备映射，通过 lisa btest dm:init 生成
\- lisa-btest.yml     测试工程配置
```

对应的 `lisa-btest.yml` 如下：

```yml
board: csk6002_c3_nano  # 编译测试固件时所用的 --board
test_command: pytest    # 测试命令，如使用 pytest 则是 pytest
```

通过 `lisa btest proj:build` 和 `lisa btest proj:flash` 可编译测试固件并烧录到硬件中。

## 快速上手

```sh
# 安装 LISA
npm install -g @listenai/lisa

# 安装 LISA Zephyr Plugin
# 配置编译环境
# 配置 Zephyr SDK
# 参照: https://docs.listenai.com/chips/600X/quick_start/installation

# 安装 LISA B-Test Plugin
lisa install -g @lisa-plugin/btest

# 进入本仓库的 example，并安装 pytest 及所需的 python 包
cd examples/test_help
pip install -r requirements.txt

# 连接好设备，并生成设备映射
lisa btest dm:init

# 运行测试
lisa btest run
```

## 命令

```sh
lisa btest run            # 运行测试
lisa btest proj:build     # 构建测试固件
lisa btest proj:flash     # 烧录测试固件
lisa btest dm:show        # 显示设备映射
lisa btest dm:init        # 生成设备映射
lisa btest list:probe     # 列出可用的调试器
lisa btest list:shell     # 列出可用的串口设备
lisa btest list:usb2xxx   # 列出可用的 USB2XXX 设备
```

## Python API

### 模块: `device`

#### `load_devices(path)`

从 `path` 加载 `device-map.yml`。`device-map.yml` 可通过 `lisa btest dm:init` 生成。

### 模块: `shell`

#### `shell_open(id, baudrate=115200, log_to=None)`

开启一个串口 shell。

- `id` - 该串口设备的序列号，串口设备应当已在 `device-map.yml` 中定义并连接到主机上。通过 `lisa btest dm:show` 可查看当前已定义的设备映射状态，通过 `lisa btest list:shell` 获得所有已连接的串口设备
- `baudrate` - 串口设备的波特率，不传默认 `115200`
- `log_to` - 将串口返回写入到指定的 `io` (如 `sys.stdout`)，不传默认 `None`

返回值：成功返回 `Shell` 实例，失败返回 `None`

#### `Shell.exec(cmd, end='\n')`

向设备发送指令。

- `cmd` - 命令字符串
- `end` - 命令结束符，不传默认 `\n`

#### `Shell.match(format, full_match=False, strip=True)`

持续按行读取设备返回，直到匹配到复合 `format` 的输出。

- `format` - 匹配字符串，支持使用 `{}` 提取片段
- `full_match` - 是否全匹配，不传默认 `False` 等效于 `parse.search`，为 `True` 等效于 `parse.parse`
- `strip` - 匹配前是否删除输出行的首末空白字符 (含 `\r` 和 `\n`)，不传默认 `True`

#### `Shell.close()`

关闭 Shell。

### 模块: `utils`

#### `logfile(dir, prefix)`

快速生成一个日志文件并打开。可配合 `shell_open` 使用：

```py
log = logfile('./logs', __name__)
shell = shell_open('/dev/ttyUSB0', log_to=log)
```

- `dir` - 日志目录
- `prefix` - 日志文件前缀

## 配置

### `lisa-btest.yml`

- `board` - 测试硬件板型，对应 `lisa zep build` 或 `west build` 的 `--board` 参数
- `test_command` - 测试命令 (如 `pytest`)，由 `lisa btest run` 执行

### `device-map.yml`

- `probe` - 调试器的序列号，可通过 `lisa btest list:probe` 获得
- `shell` - 串口设备的序列号，可通过 `lisa btest list:shell` 获得
- `usb2xxx` - USB2XXX 适配器的序列号，可通过 `lisa btest list:usb2xxx` 获得

[lpm-img]: https://img.shields.io/badge/dynamic/json?style=flat-square&label=lpm&color=green&query=latestVersion&url=https%3A%2F%2Flpm.listenai.com%2Fapi%2Fcloud%2Fpackages%2Fdetail%3Fname%3D%40lisa-plugin%2Fbtest
[lpm-url]: https://lpm.listenai.com/lpm/info/?keyword=%40lisa-plugin%2Fbtest
[issues-img]: https://img.shields.io/github/issues/LISTENAI/lisa-plugin-btest?style=flat-square
[issues-url]: https://github.com/LISTENAI/lisa-plugin-btest/issues
[stars-img]: https://img.shields.io/github/stars/LISTENAI/lisa-plugin-btest?style=flat-square
[stars-url]: https://github.com/LISTENAI/lisa-plugin-btest/stargazers
[commits-img]: https://img.shields.io/github/last-commit/LISTENAI/lisa-plugin-btest?style=flat-square
[commits-url]: https://github.com/LISTENAI/lisa-plugin-btest/commits/master
