"""
文件说明：USB2XXX CANFD操作相关函数集合
更多帮助：www.toomoss.com
"""
from ctypes import *
import platform
from usb_device import *

# 1.CANFD信息帧的数据类型定义
class CANFD_MSG(Structure):
    _fields_ = [
        ("ID",c_uint),          # 报文ID,bit[30]-RTR,bit[31]-IDE,bit[28..0]-ID
        ("DLC",c_ubyte),        # 数据字节长度，可设置为-0,1,2,3,4,5,6,7,8,12,16,20,24,32,48,64
        ("Flags",c_ubyte),      # bit[0]-BRS,bit[1]-ESI,bit[2]-FDF,bit[6..5]-Channel,bit[7]-RXD
        ("__Res0",c_ubyte),     # 保留
        ("__Res1",c_ubyte),     # 保留。
        ("TimeStamp",c_uint),   # 帧接收或者发送时的时间戳，单位为10us
        ("Data",c_ubyte*64),    # 报文的数据。
    ]

# 2.CANFD初始化配置数据类型定义
class CANFD_INIT_CONFIG(Structure):
    _fields_ = [
        # CAN波特率 = 40M/BRP*(1+SEG1+SEG2)
        ("Mode",c_ubyte),         # 0-正常模式，1-自发自收模式
        ("ISOCRCEnable",c_ubyte), # 0-禁止ISO CRC,1-使能ISO CRC
        ("RetrySend",c_ubyte),    # 0-禁止重发，1-无限制重发
        ("ResEnable",c_ubyte),    # 0-不接入内部120欧终端电阻，1-接入内部120欧终端电阻
        ("NBT_BRP",c_ubyte),      # CAN工作模式，0-正常模式，1-环回模式，2-静默模式，3-静默环回模式
        ("NBT_SEG1",c_ubyte),     # 自动离线管理，0-禁止，1-使能
        ("NBT_SEG2",c_ubyte),     # 报文重发管理，0-使能报文重传，1-禁止报文重传
        ("NBT_SJW",c_ubyte),      # FIFO锁定管理，0-新报文覆盖旧报文，1-丢弃新报文
        ("DBT_BRP",c_ubyte),      # 发送优先级管理，0-标识符决定，1-发送请求顺序决定
        ("DBT_SEG1",c_ubyte),
        ("DBT_SEG2",c_ubyte),
        ("DBT_SJW",c_ubyte),
        ("__Res0",c_ubyte*8),
    ]
# 3.CANFD诊断帧信息结构体定义
class CANFD_DIAGNOSTIC(Structure):
    _fields_ = [
        ("NREC",c_ubyte),
        ("NTEC",c_ubyte),
        ("DREC",c_ubyte),
        ("DTEC",c_ubyte),
        ("ErrorFreeMsgCount",c_uint16),
        ("Flags",c_uint16),
    ]
# 4.CANFD总线错误信息结构体定义
class CANFD_BUS_ERROR(Structure):
    _fields_ = [
        ("TEC",c_ubyte),
        ("REC",c_ubyte),
        ("Flags",c_ubyte),
        ("__Res0",c_ubyte),
    ]
# 5.CAN 滤波器设置数据类型定义
class CANFD_FILTER_CONFIG(Structure):
    _fields_ = [
        # Bootloader相关命令
        ("Enable",c_ubyte),  # 使能该过滤器，1-使能，0-禁止
        ("Index",c_ubyte),   # 过滤器索引号，取值范围为0到31
        ("__Res0",c_ubyte),
        ("__Res1",c_ubyte),
        ("ID_Accept",c_uint),# 验收码ID,bit[28..0]为有效ID位，bit[31]为IDE
        ("ID_Mask",c_uint),  # 屏蔽码，对应bit位若为1，则需要对比对应验收码bit位，相同才接收
    ]
# 6.函数返回值错误信息定义
CANFD_SUCCESS            = (0)   # 函数执行成功
CANFD_ERR_NOT_SUPPORT    = (-1)  # 适配器不支持该函数
CANFD_ERR_USB_WRITE_FAIL = (-2)  # USB写数据失败
CANFD_ERR_USB_READ_FAIL  = (-3)  # USB读数据失败
CANFD_ERR_CMD_FAIL       = (-4)  # 命令执行失败
# CANFD_MSG.ID定义
CANFD_MSG_FLAG_RTR     = (0x40000000)
CANFD_MSG_FLAG_IDE     = (0x80000000)
CANFD_MSG_FLAG_ID_MASK = (0x1FFFFFFF)
# CANFD_MSG.Flags定义
CANFD_MSG_FLAG_BRS     = (0x01)
CANFD_MSG_FLAG_ESI     = (0x02)
CANFD_MSG_FLAG_FDF     = (0x04)
CANFD_MSG_FLAG_RXD     = (0x80)
# CANFD_DIAGNOSTIC.Flags定义
CANFD_DIAGNOSTIC_FLAG_NBIT0_ERR    = (0x0001)# 在发送报文（或应答位、主动错误标志或过载标志）期间，器件要发送显性电平（逻辑值为0的数据或标识符位），但监视的总线值为隐性。
CANFD_DIAGNOSTIC_FLAG_NBIT1_ERR    = (0x0002)# 在发送报文（仲裁字段除外）期间，器件要发送隐性电平（逻辑值为1的位），但监视到的总线值为显性。
CANFD_DIAGNOSTIC_FLAG_NACK_ERR     = (0x0004)# 发送报文未应答。
CANFD_DIAGNOSTIC_FLAG_NFORM_ERR    = (0x0008)# 接收报文的固定格式部分格式错误。
CANFD_DIAGNOSTIC_FLAG_NSTUFF_ERR   = (0x0010)# 在接收报文的一部分中，序列中包含了5个以上相等位，而报文中不允许出现这种序列。
CANFD_DIAGNOSTIC_FLAG_NCRC_ERR     = (0x0020)# 接收的报文的CRC校验和不正确。输入报文的CRC与通过接收到的数据计算得到的CRC不匹配。
CANFD_DIAGNOSTIC_FLAG_TXBO_ERR     = (0x0080)# 器件进入离线状态（且自动恢复）。
CANFD_DIAGNOSTIC_FLAG_DBIT0_ERR    = (0x0100)# 见NBIT0_ERR
CANFD_DIAGNOSTIC_FLAG_DBIT1_ERR    = (0x0200)# 见NBIT1_ERR
CANFD_DIAGNOSTIC_FLAG_DFORM_ERR    = (0x0800)# 见NFORM_ERR
CANFD_DIAGNOSTIC_FLAG_DSTUFF_ERR   = (0x1000)# 见NSTUFF_ERR
CANFD_DIAGNOSTIC_FLAG_DCRC_ERR     = (0x2000)# 见NCRC_ERR
CANFD_DIAGNOSTIC_FLAG_ESI_ERR      = (0x4000)# 接收的CAN FD报文的ESI标志置1
CANFD_DIAGNOSTIC_FLAG_DLC_MISMATCH = (0x8000)# DLC不匹配,在发送或接收期间，指定的DLC大于FIFO元素的PLSIZE
# CANFD_BUS_ERROR.Flags定义
CANFD_BUS_ERROR_FLAG_TX_RX_WARNING  = (0x01)
CANFD_BUS_ERROR_FLAG_RX_WARNING     = (0x02)
CANFD_BUS_ERROR_FLAG_TX_WARNING     = (0x04)
CANFD_BUS_ERROR_FLAG_RX_BUS_PASSIVE = (0x08)
CANFD_BUS_ERROR_FLAG_TX_BUS_PASSIVE = (0x10)
CANFD_BUS_ERROR_FLAG_TX_BUS_OFF     = (0x20)

def CANFD_Init(DevHandle, CANIndex, pCanConfig):
    return USB2XXXLib.CANFD_Init(DevHandle, CANIndex, pCanConfig)

def CANFD_StartGetMsg(DevHandle, CANIndex):
    return USB2XXXLib.CANFD_StartGetMsg(DevHandle, CANIndex)

def CANFD_StopGetMsg(DevHandle, CANIndex):
    return USB2XXXLib.CANFD_StopGetMsg(DevHandle, CANIndex)


def CANFD_SendMsg(DevHandle, CANIndex, pCanSendMsg,SendMsgNum):
    return USB2XXXLib.CANFD_SendMsg(DevHandle, CANIndex, pCanSendMsg,SendMsgNum)


def CANFD_GetMsg(DevHandle, CANIndex, pCanGetMsg,BufferSize):
    return USB2XXXLib.CANFD_GetMsg(DevHandle, CANIndex, pCanGetMsg,BufferSize)

def CANFD_SetFilter(DevHandle, CANIndex, pCanFilter,Len):
    return USB2XXXLib.CANFD_SetFilter(DevHandle, CANIndex, pCanFilter,Len)

def CANFD_GetDiagnostic(DevHandle, CANIndex, pCanDiagnostic):
    return USB2XXXLib.CANFD_GetDiagnostic(DevHandle, CANIndex, pCanDiagnostic)

def CANFD_GetBusError(DevHandle, CANIndex, pCanBusError):
    return USB2XXXLib.CANFD_GetBusError(DevHandle, CANIndex, pCanBusError)

def CANFD_SetSchedule(DevHandle, CANIndex, pCanMsgTab,pMsgNum,pSendTimes,MsgTabNum):
    return USB2XXXLib.CANFD_SetSchedule(DevHandle, CANIndex, pCanMsgTab,pMsgNum,pSendTimes,MsgTabNum)

def CANFD_StartSchedule(DevHandle, CANIndex, MsgTabIndex,TimePrecMs, OrderSend):
    return USB2XXXLib.CANFD_StartSchedule(DevHandle, CANIndex, MsgTabIndex,TimePrecMs, OrderSend)

def CANFD_StopSchedule(DevHandle, CANIndex):
    return USB2XXXLib.CANFD_StopSchedule(DevHandle, CANIndex)
