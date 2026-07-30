#!/usr/bin/env python3
"""
DAS 实例巡检报告获取脚本

获取阿里云 DAS 数据库实例巡检报告，支持：
- 获取巡检报告列表
- 获取巡检报告详情
- 按时间/实例筛选

用法：
    # 获取最新一份报告
    python3 get_inspection_report.py --latest --pipe
    
    # 获取最近 5 份报告列表
    python3 get_inspection_report.py --list --limit 5 --pipe
    
    # 获取指定实例的最新报告
    python3 get_inspection_report.py --instance-id your-instance-id --latest --pipe
    
    # 获取报告详情
    python3 get_inspection_report.py --report-id rpt_xxx --detail --pipe
"""

import os
import sys
import json
import uuid
import hmac
import hashlib
import argparse
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List

try:
    import requests
except ImportError:
    print("错误：需要安装 requests 库", file=sys.stderr)
    sys.exit(1)

# API 配置
# 支持通过环境变量指定 Endpoint，默认使用上海区域
API_ENDPOINT = os.environ.get('DAS_ENDPOINT', 'https://das.cn-shanghai.aliyuncs.com/')
API_VERSION = "2020-01-16"


def get_timestamp() -> str:
    """获取 ISO8601 格式的时间戳（UTC 时间）"""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def calculate_signature_v3(
    method: str,
    access_key_secret: str,
    headers: Dict[str, str],
    body: str
) -> str:
    """
    计算 ACS3-HMAC-SHA256 签名 (V3)
    使用 hex 格式（小写）
    """
    # URI (固定为 /)
    uri = "/"
    
    # 查询字符串 (空)
    canonicalized_query_string = ""
    
    # 收集需要签名的 header
    signed_headers_list = []
    canonicalized_headers_dict = {}
    
    for header_name, header_value in headers.items():
        header_lower = header_name.lower()
        if header_lower.startswith("x-acs-") or header_lower == "host":
            signed_headers_list.append(header_lower)
            canonicalized_headers_dict[header_lower] = header_value.strip()
    
    # 按字典序排序
    signed_headers_list.sort()
    signed_headers = ";".join(signed_headers_list)
    
    # CanonicalHeaders
    canonicalized_headers = "\n".join(
        f"{h}:{canonicalized_headers_dict[h]}"
        for h in signed_headers_list
    )
    canonicalized_headers += "\n\n"
    
    # 请求体的 SHA256
    hashed_request_body = hashlib.sha256(body.encode("utf-8")).hexdigest().lower()
    
    # 构造 CanonicalRequest
    canonicalized_request = (
        f"{method.upper()}\n"
        f"{uri}\n"
        f"{canonicalized_query_string}\n"
        f"{canonicalized_headers}"
        f"{signed_headers}\n"
        f"{hashed_request_body}"
    )
    
    # 计算 CanonicalRequest 的 SHA256
    hashed_canonicalized_request = hashlib.sha256(canonicalized_request.encode("utf-8")).hexdigest().lower()
    
    # 构造 StringToSign
    string_to_sign = f"ACS3-HMAC-SHA256\n{hashed_canonicalized_request}"
    
    # 计算 HMAC-SHA256，使用 hex 格式
    key = access_key_secret.encode("utf-8")
    message = string_to_sign.encode("utf-8")
    signature = hmac.new(key, message, hashlib.sha256).hexdigest().lower()
    
    return signature


def get_credentials() -> Dict[str, Optional[str]]:
    """从环境变量获取阿里云凭据（支持多种命名规范，兼容 QoderWork/OpenClaw/其他 AI 工具）"""
    
    # 支持多种环境变量命名（按优先级）
    # 1. QoderWork / 阿里云官方：ALIBABA_CLOUD_*
    # 2. 阿里云简写：ALIBABA_*
    # 3. 通用形式：ACCESS_KEY_*
    
    access_key_id = (
        os.environ.get("ALIBABA_CLOUD_ACCESS_KEY_ID") or
        os.environ.get("ALIBABA_ACCESS_KEY_ID") or
        os.environ.get("ACCESS_KEY_ID")
    )
    
    access_key_secret = (
        os.environ.get("ALIBABA_CLOUD_ACCESS_KEY_SECRET") or
        os.environ.get("ALIBABA_ACCESS_KEY_SECRET") or
        os.environ.get("ACCESS_KEY_SECRET")
    )
    
    security_token = os.environ.get("ALIBABA_CLOUD_SECURITY_TOKEN")
    agent_id = os.environ.get("ALIBABA_CLOUD_DAS_AGENT_ID")
    
    return {
        "access_key_id": access_key_id,
        "access_key_secret": access_key_secret,
        "security_token": security_token,
        "agent_id": agent_id
    }


def call_das_api(
    action: str,
    params: Dict[str, Any],
    credentials: Dict[str, Optional[str]]
) -> Dict:
    """
    调用 DAS API
    
    Args:
        action: API 名称
        params: 请求参数
        credentials: 凭据
    
    Returns:
        API 响应
    """
    # 构建请求 body（按键排序）
    body_params = {
        "Action": action,
        "Version": API_VERSION,
        "Format": "JSON",
        "SecureTransport": "true"
    }
    body_params.update({k: v for k, v in params.items() if v is not None})
    
    sorted_params = sorted(body_params.items())
    body_str = "&".join(f"{k}={v}" for k, v in sorted_params)
    
    # 构建 headers
    signature_nonce = str(uuid.uuid4())
    timestamp = get_timestamp()
    content_sha256 = hashlib.sha256(body_str.encode("utf-8")).hexdigest().lower()
    
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Host": "das.cn-shanghai.aliyuncs.com",
        "x-acs-action": action,
        "x-acs-version": API_VERSION,
        "x-acs-date": timestamp,
        "x-acs-signature-nonce": signature_nonce,
        "x-acs-content-sha256": content_sha256
    }
    
    if credentials.get("security_token"):
        headers["x-acs-security-token"] = credentials["security_token"]
    
    # 计算签名
    signature = calculate_signature_v3("POST", credentials["access_key_secret"] or "", headers, body_str)
    
    # 添加 Authorization header
    signed_headers_list = sorted([k.lower() for k in headers.keys() if k.lower().startswith("x-acs-") or k.lower() == "host"])
    signed_headers = ";".join(signed_headers_list)
    
    headers["Authorization"] = f"ACS3-HMAC-SHA256 Credential={credentials['access_key_id']},SignedHeaders={signed_headers},Signature={signature}"
    
    # 发送请求
    try:
        if os.environ.get("DEBUG"):
            print(f"DEBUG: Body={body_str[:500]}", file=sys.stderr)
        
        response = requests.post(
            API_ENDPOINT,
            data=body_str.encode("utf-8"),
            headers=headers,
            timeout=180
        )
        
        # 调试
        if os.environ.get("DEBUG"):
            print(f"DEBUG: Status={response.status_code}", file=sys.stderr)
            print(f"DEBUG: Response={response.text[:500]}", file=sys.stderr)
        
        response.raise_for_status()
        result = response.json()
        
        # 添加 success 字段
        result["success"] = result.get("Success", True)
        
        return result
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "error": {
                "code": "RequestError",
                "message": str(e)
            }
        }


def get_report_list(
    credentials: Dict[str, Optional[str]],
    instance_id: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    page_number: int = 1,
    page_size: int = 10,
    region_id: str = "cn-hangzhou"
) -> Dict:
    """获取巡检报告列表"""
    params = {
        "PageNumber": page_number,
        "PageSize": page_size,
        "RegionId": region_id
    }
    
    # 如果没有指定时间，默认查询最近 7 天（使用毫秒时间戳）
    if not start_time:
        from datetime import timedelta
        start_dt = datetime.now() - timedelta(days=7)
        start_time = str(int(start_dt.timestamp() * 1000))
    if not end_time:
        end_time = str(int(datetime.now().timestamp() * 1000))
    
    if instance_id:
        params["InstanceId"] = instance_id
    
    params["StartTime"] = start_time
    params["EndTime"] = end_time
    
    # 调试
    if os.environ.get("DEBUG"):
        print(f"DEBUG: API params={params}", file=sys.stderr)
    
    return call_das_api("GetInstanceGroupInspectReportList", params, credentials)


def get_report_detail(
    credentials: Dict[str, Optional[str]],
    report_id: str
) -> Dict:
    """获取巡检报告详情"""
    params = {
        "ReportId": report_id
    }
    
    return call_das_api("GetInstanceGroupInspectReportDetail", params, credentials)


def output_result(result: Dict, pipe_mode: bool = False, json_mode: bool = False):
    """输出结果"""
    if json_mode:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif pipe_mode:
        if result.get("success", True):
            print("\n=== INSPECTION_REPORT_START ===", file=sys.stdout)
            # 直接输出报告内容，不做加工
            if "Data" in result:
                # 如果是报告详情，直接输出 ReportDetail 字段
                if "ReportDetail" in result["Data"]:
                    print(result["Data"]["ReportDetail"], file=sys.stdout)
                else:
                    print(json.dumps(result["Data"], ensure_ascii=False, indent=2), file=sys.stdout)
            else:
                print(json.dumps(result, ensure_ascii=False, indent=2), file=sys.stdout)
            print("=== INSPECTION_REPORT_END ===", file=sys.stdout)
        else:
            error = result.get("error", {})
            print(f"\n❌ 错误 [{error.get('code')}]: {error.get('message')}", file=sys.stderr)
    else:
        if result.get("success", True):
            print("\n=== 巡检报告 ===")
            if "Data" in result:
                if "ReportDetail" in result["Data"]:
                    print(result["Data"]["ReportDetail"])
                else:
                    print(json.dumps(result["Data"], ensure_ascii=False, indent=2))
            else:
                print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            error = result.get("error", {})
            print(f"\n❌ 错误 [{error.get('code')}]: {error.get('message')}")


def main():
    parser = argparse.ArgumentParser(description="DAS 实例巡检报告获取脚本")
    
    # 操作模式
    mode_group = parser.add_mutually_exclusive_group()
    mode_group.add_argument("--list", action="store_true", help="获取报告列表")
    mode_group.add_argument("--latest", action="store_true", help="获取最新一份报告")
    mode_group.add_argument("--detail", action="store_true", help="获取报告详情")
    
    # 筛选参数
    parser.add_argument("--instance-id", help="实例 ID")
    parser.add_argument("--report-id", help="报告 ID（--detail 模式必需）")
    parser.add_argument("--limit", type=int, default=5, help="获取最近 N 份报告（默认 5）")
    parser.add_argument("--date", help="指定日期（YYYY-MM-DD）")
    parser.add_argument("--start-time", help="开始时间（ISO 8601 格式）")
    parser.add_argument("--end-time", help="结束时间（ISO 8601 格式）")
    
    # 输出模式
    parser.add_argument("--pipe", action="store_true", help="管道模式")
    parser.add_argument("--json", action="store_true", help="JSON 模式")
    
    args = parser.parse_args()
    
    # 获取凭据
    credentials = get_credentials()
    
    # 检查凭据
    if not credentials["access_key_id"] or not credentials["access_key_secret"]:
        output_result({
            "success": False,
            "error": {
                "code": "MissingCredentials",
                "message": "缺少阿里云访问凭据，请设置 ALIBABA_CLOUD_ACCESS_KEY_ID 和 ALIBABA_CLOUD_ACCESS_KEY_SECRET"
            }
        }, args.pipe, args.json)
        sys.exit(1)
    
    # 检查必需参数
    if args.detail and not args.report_id:
        output_result({
            "success": False,
            "error": {
                "code": "MissingParameter",
                "message": "--detail 模式需要指定 --report-id"
            }
        }, args.pipe, args.json)
        sys.exit(1)
    
    # 处理时间参数
    if args.date and not args.start_time:
        args.start_time = f"{args.date}T00:00:00Z"
        args.end_time = f"{args.date}T23:59:59Z"
    
    # 执行操作
    result = None
    
    if args.list:
        # 获取报告列表
        if args.pipe:
            print(f"正在获取最近 {args.limit} 份巡检报告...", file=sys.stderr)
        
        result = get_report_list(
            credentials,
            instance_id=args.instance_id,
            start_time=args.start_time,
            end_time=args.end_time,
            page_size=args.limit
        )
    
    elif args.latest:
        # 获取最新一份报告
        if args.pipe:
            print("正在获取最新一份巡检报告...", file=sys.stderr)
        
        result = get_report_list(
            credentials,
            instance_id=args.instance_id,
            page_size=1
        )
        
        # 如果有报告，获取详情
        # 注意：API 返回的 Data 直接是列表
        if result.get("success") and result.get("Data"):
            reports = result["Data"] if isinstance(result["Data"], list) else result["Data"].get("ReportList", [])
            if reports:
                latest_report = reports[0]
                report_id = latest_report.get("ReportId")
                
                if args.pipe:
                    print(f"获取报告详情：{report_id}", file=sys.stderr)
                    print("", file=sys.stderr)  # 空行分隔
                
                result = get_report_detail(credentials, report_id)
    
    elif args.detail:
        # 获取报告详情
        if args.pipe:
            print(f"正在获取报告详情：{args.report_id}", file=sys.stderr)
        
        result = get_report_detail(credentials, args.report_id)
    
    # 输出结果
    if result:
        output_result(result, args.pipe, args.json)
    else:
        output_result({
            "success": False,
            "error": {
                "code": "InvalidOperation",
                "message": "请指定操作模式：--list, --latest, 或 --detail"
            }
        }, args.pipe, args.json)
        sys.exit(1)


if __name__ == "__main__":
    main()
