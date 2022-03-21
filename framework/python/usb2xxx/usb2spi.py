"""
文件说明：USB2XXX ADC操作相关函数集合
更多帮助：www.usbxyz.com
"""
from ctypes import *
import platform
from usb_device import *

# Error code define
SPI_SUCCESS = 0             # success
SPI_ERR_NOT_SUPPORT = -1    # USB2XXX not support
SPI_ERR_USB_WRITE_FAIL = -2 # USB write data error
SPI_ERR_USB_READ_FAIL = -3  # USB read data error
SPI_ERR_CMD_FAIL = -4       # execute function error

# 定义SPI通道
SPI1        = 0x00
SPI1_CS0    = 0x00
SPI1_CS1    = 0x10
SPI1_CS2    = 0x20
SPI1_CS3    = 0x30
SPI1_CS4    = 0x40

SPI2        = 0x01
SPI2_CS0    = 0x01
SPI2_CS1    = 0x11
SPI2_CS2    = 0x21
SPI2_CS3    = 0x31
SPI2_CS4    = 0x41

# 定义工作模式
SPI_MODE_HARD_FDX       = 0 # 硬件控制（全双工模式）
SPI_MODE_HARD_HDX       = 1 # 硬件控制（半双工模式）
SPI_MODE_SOFT_HDX       = 2 # 软件控制（半双工模式）
SPI_MODE_SOFT_ONE_WIRE  = 3 # 单总线模式，数据线输入输出都为MOSI
# 定义主从机模式
SPI_MASTER      = 1 # 主机
SPI_SLAVE       = 0 # 从机
# 定义数据移位方式
SPI_MSB         = 0 # 高位在前
SPI_LSB         = 1 # 低位在前
# 定义片选输出极性
SPI_SEL_LOW     = 0 # 片选输出低电平
SPI_SEL_HIGH    = 1 # 片选输出高电平

# definition of ADC receive callback
if(platform.system()=="Windows"):
    SPI_GET_DATA_HANDLE = WINFUNCTYPE(c_int,c_int,c_int,c_void_p,c_int)# First argument is return type
else:
    SPI_GET_DATA_HANDLE = CFUNCTYPE(c_int,c_int,c_int,c_void_p,c_int)# First argument is return type

# SPI初始化参数结构体
class SPI_CONFIG(Structure):
    _fields_ = [
        ("Mode", c_ubyte),       # SPI控制方式:0-硬件控制（全双工模式）,1-硬件控制（半双工模式），2-软件控制（半双工模式）,3-单总线模式，数据线输入输出都为MOSI
        ("Master", c_ubyte),     # 主从选择控制:0-从机，1-主机
        ("CPOL", c_ubyte),       # 时钟极性控制:0-SCK空闲时为低电平，1-SCK空闲时为高电平
        ("CPHA",c_ubyte),        # 时钟相位控制:0-第一个SCK时钟采样，1-第二个SCK时钟采样
        ("LSBFirst",c_ubyte),    # 数据移位方式:0-MSB在前，1-LSB在前
        ("SelPolarity",c_ubyte), # 片选信号极性:0-低电平选中，1-高电平选中
        ("ClockSpeedHz",c_uint) # SPI时钟频率:单位为HZ，硬件模式下最大50000000，最小390625，频率按2的倍数改变
    ]

# 定义SPI Flash器件配置参数数据类型
class SPI_FLASH_CONFIG(Structure):
    _fields_ = [
    ("CMD_WriteEnable", c_ubyte),            # 使能写命令
    (" CMD_WriteDisable", c_ubyte),          # 禁止写命令
    ("CMD_WritePage", c_ubyte),              # 写数据命令
    ("WritePageAddressBytes", c_ubyte),      # 写数据时的地址宽度，单位为字节
    ("CMD_EraseSector", c_ubyte),            # 扇区擦出命令
    ("EraseSectorAddressBytes", c_ubyte),    # 扇区擦出的地址宽度，单位为字节
    ("CMD_EraseBulk", c_ubyte),              # 块擦出命令
    ("CMD_EraseChip", c_ubyte),              # 整片擦出命令
    ("CMD_ReadID", c_ubyte),                 # 读芯片ID命令
    ("CMD_ReadData", c_ubyte),               # 读数据命令
    ("ReadDataAddressBytes", c_ubyte),       # 读数据时的地址宽度，单位为字节
    ("CMD_ReadFast", c_ubyte),               # 快速模式读数据命令
    ("ReadFastAddressBytes", c_ubyte),       # 快速读数据时的地址宽度，单位为字节
    ("CMD_ReadStatus", c_ubyte),             # 读取状态寄存器命令
    ("CMD_WriteStatus", c_ubyte),            # 写状态寄存器命令
    ("ID", c_ubyte*16),                      # 芯片ID存储数组
    ("ID_Length", c_ubyte),                  # ID长度，单位为字节
    ("PageSize", c_int),                    # 页大小，单位为字节
    ("NumPages", c_int),                    # 芯片总的页数
    ("SectorSize", c_int),                  # 扇区大小，单位为字节
    ]
# SPI基础函数
# SPI初始化配置函数
def SPI_Init(DevHandle,SPIIndex, pConfig):
    return USB2XXXLib.SPI_Init(DevHandle,SPIIndex, pConfig)
# SPI写数据，该函数必须等待SPI数据传输完毕之后再返回
def SPI_WriteBytes(DevHandle,SPIIndex,pWriteData,WriteLen):
    return USB2XXXLib.SPI_WriteBytes(DevHandle,SPIIndex,pWriteData,WriteLen)
# SPI异步模式写数据，调用该函数不等待数据发送完毕立即返回，下次发送数据的时候会等待之前的数据传输完毕
def SPI_WriteBytesAsync(DevHandle,SPIIndex,pWriteData,WriteLen):
    return USB2XXXLib.SPI_WriteBytesAsync(DevHandle,SPIIndex,pWriteData,WriteLen)
# SPI读数据
def SPI_ReadBytes(DevHandle,SPIIndex,pReadData,ReadLen):
    return USB2XXXLib.SPI_ReadBytes(DevHandle,SPIIndex,pReadData,ReadLen)
# SPI写读数据
def SPI_WriteReadBytes(DevHandle,SPIIndex,pWriteData,WriteLen,pReadData,ReadLen,IntervalTimeUs):
    return USB2XXXLib.SPI_WriteReadBytes(DevHandle,SPIIndex,pWriteData,WriteLen,pReadData,ReadLen,IntervalTimeUs)

# 二进制模式操作函数
# 二进制模式写数据
def SPI_WriteBits(DevHandle,SPIIndex,pWriteBitStr):
    return USB2XXXLib.SPI_WriteBits(DevHandle,SPIIndex,pWriteBitStr) 
# 二进制模式读数据
def SPI_ReadBits(DevHandle,SPIIndex,pReadBitStr,ReadBitsNum):
    return USB2XXXLib.SPI_ReadBits(DevHandle,SPIIndex,pReadBitStr,ReadBitsNum)
# 二进制模式写读数据
def SPI_WriteReadBits(DevHandle,SPIIndex,pWriteBitStr,pReadBitStr,ReadBitsNum):
    return USB2XXXLib.SPI_WriteReadBits(DevHandle,SPIIndex,pWriteBitStr,pReadBitStr,ReadBitsNum)

# SPI 块操作相关函数
# Block模式写数据
def SPI_BlockWriteBytes(DevHandle,SPIIndex,pWriteData,BlockSize,BlockNum,IntervalTimeUs):
    return USB2XXXLib.SPI_BlockWriteBytes(DevHandle,SPIIndex,pWriteData,BlockSize,BlockNum,IntervalTimeUs)
# Block模式读数据
def SPI_BlockReadBytes(DevHandle,SPIIndex,pReadData,BlockSize,BlockNum,IntervalTimeUs):
    return USB2XXXLib.SPI_BlockReadBytes(DevHandle,SPIIndex,pReadData,BlockSize,BlockNum,IntervalTimeUs)
# Block模式写读数据
def SPI_BlockWriteReadBytes(DevHandle,SPIIndex,pWriteData,WriteBlockSize,pReadData,ReadBlockSize,BlockNum,IntervalTimeUs):
    return USB2XXXLib.SPI_BlockWriteReadBytes(DevHandle,SPIIndex,pWriteData,WriteBlockSize,pReadData,ReadBlockSize,BlockNum,IntervalTimeUs)

# SPI从机模式相关函数
# 从机模式写数据
def SPI_SlaveWriteBytes(DevHandle,SPIIndex,pWriteData,WriteLen,TimeOutMs):
    return USB2XXXLib.SPI_SlaveWriteBytes(DevHandle,SPIIndex,pWriteData,WriteLen,TimeOutMs)
# 从机模式读数据
def SPI_SlaveReadBytes(DevHandle,SPIIndex,pReadData,ReadLen,TimeOutMs):
    return USB2XXXLib.SPI_SlaveReadBytes(DevHandle,SPIIndex,pReadData,ReadLen,TimeOutMs)
# SPI从机模式下读写数据
def SPI_SlaveReadWriteBytes(DevHandle,SPIIndex,pReadData,ReadDataLen,pWriteData,WriteDataLen,TimeOutMs):
    return USB2XXXLib.SPI_SlaveReadWriteBytes(DevHandle,SPIIndex,pReadData,ReadDataLen,pWriteData,WriteDataLen,TimeOutMs)
# SPI从机模式下写读数据
def SPI_SlaveWriteReadBytes(DevHandle,SPIIndex,pWriteData,WriteDataLen,pReadData,ReadDataLen,TimeOutMs):
    return USB2XXXLib.SPI_SlaveWriteReadBytes(DevHandle,SPIIndex,pWriteData,WriteDataLen,pReadData,ReadDataLen,TimeOutMs)
# 从机模式连续读数据，该函数会启动一个线程读取数据
def SPI_SlaveContinueRead(DevHandle,SPIIndex,pSlaveReadDataHandle):
    return USB2XXXLib.SPI_SlaveContinueRead(DevHandle,SPIIndex,pSlaveReadDataHandle)
# 从机模式读数据，该数据已经被内部读数据线程读到内部缓冲区中
def SPI_SlaveGetBytes(DevHandle,SPIIndex,pReadData,BufferSize):
    return USB2XXXLib.SPI_SlaveGetBytes(DevHandle,SPIIndex,pReadData,BufferSize)
# 停止从机模式连续读数据
def SPI_SlaveContinueWriteReadStop(DevHandle,SPIIndex):
    return USB2XXXLib.SPI_SlaveContinueWriteReadStop(DevHandle,SPIIndex)

#SPI Flash操作相关函数
# Flash参数初始化
def SPI_FlashInit(DevHandle,SPIIndex,ClockSpeed,pConfig):
    return USB2XXXLib.SPI_FlashInit(DevHandle,SPIIndex,ClockSpeed,pConfig)
# Flash读取芯片ID
def SPI_FlashReadID(DevHandle,SPIIndex,pID):
    return USB2XXXLib.SPI_FlashReadID(DevHandle,SPIIndex,pID)
# Flash擦出扇区
def SPI_FlashEraseSector(DevHandle,SPIIndex,StartSector,NumSector):
    return USB2XXXLib.SPI_FlashEraseSector(DevHandle,SPIIndex,StartSector,NumSector)
# Flash擦出整片
def SPI_FlashEraseChip(DevHandle,SPIIndex):
    return USB2XXXLib.SPI_FlashEraseChip(DevHandle,SPIIndex)
# Flash写数据
def SPI_FlashWrite(DevHandle,SPIIndex,StartAddr,pWriteData,WriteLen):
    return USB2XXXLib.SPI_FlashWrite(DevHandle,SPIIndex,StartAddr,pWriteData,WriteLen)
# Flash读数据
def SPI_FlashRead(DevHandle,SPIIndex,StartAddr,pReadData,ReadLen):
    return USB2XXXLib.SPI_FlashRead(DevHandle,SPIIndex,StartAddr,pReadData,ReadLen)
# Flash快速模式读数据
def SPI_FlashReadFast(DevHandle,SPIIndex,StartAddr,pReadData,ReadLen):
    return USB2XXXLib.SPI_FlashReadFast(DevHandle,SPIIndex,StartAddr,pReadData,ReadLen)


