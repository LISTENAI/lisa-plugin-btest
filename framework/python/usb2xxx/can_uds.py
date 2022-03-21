"""
文件说明：USB2XXX CAN UDS操作相关函数集合
更多帮助：www.toomoss.com
"""
from ctypes import *
from .usb_device import *

# CAN UDS地址定义
class CAN_UDS_ADDR(Structure):
    _fields_ = [
        ("ReqID",c_uint),       # 请求报文ID。
        ("ResID",c_uint),       # 应答报文ID。
        ("ExternFlag",c_ubyte), # 0-标准帧，1-扩展帧
        ("AddrFormats",c_ubyte),# 0-normal, 1-extended ,2-mixed。
        ("AddrExt",c_ubyte),    # 当AddrFormats不为normal时，该数据放到CAN数据域第1字节
        ("__Res",c_ubyte*8),         
    ]


# 函数返回错误代码定义
CAN_UDS_OK           = 0
CAN_UDS_TRAN_USB     = -98
CAN_UDS_TRAN_CAN     = -99
CAN_UDS_TIMEOUT_A    = -100
CAN_UDS_TIMEOUT_Bs   = -101
CAN_UDS_TIMEOUT_Cr   = -102
CAN_UDS_WRONG_SN     = -103
CAN_UDS_INVALID_FS   = -104
CAN_UDS_UNEXP_PDU    = -105
CAN_UDS_WFT_OVRN     = -106
CAN_UDS_BUFFER_OVFLW = -107
CAN_UDS_ERROR        = -108

def CAN_UDS_Request(DevHandle, CANIndex, pUDSAddr,pReqData,DataLen):
    return USB2XXXLib.CAN_UDS_Request(DevHandle, CANIndex, pUDSAddr,pReqData,DataLen)

def CAN_UDS_Response(DevHandle, CANIndex, pUDSAddr,pResData,TimeOutMs):
    return USB2XXXLib.CAN_UDS_Response(DevHandle, CANIndex, pUDSAddr,pResData,TimeOutMs)
