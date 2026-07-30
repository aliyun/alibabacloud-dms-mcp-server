#!/usr/bin/env python3
"""
DAS Agent API Client for RDS MySQL Ops
Supports getDasAgentSSE and other DAS operations with V3 signature.
"""

import argparse
import hashlib
import hmac
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from urllib.parse import quote_plus

import requests

# Default configuration
DEFAULT_ENDPOINT = "das.cn-hangzhou.aliyuncs.com"
DEFAULT_VERSION = "2020-01-16"
DEFAULT_REGION = "cn-hangzhou"

def percent_encode(s):
    """RFC3986 URL encoding"""
    if not s:
        return ""
    encoded = quote_plus(str(s), safe='-_.~')
    return encoded.replace('+', '%20').replace('*', '%2A').replace('%7E', '~')

def sha256_hex(data):
    """Calculate SHA256 hash (lowercase hex)"""
    if isinstance(data, str):
        data = data.encode('utf-8')
    return hashlib.sha256(data).hexdigest().lower()

def hmac_sha256(key, msg):
    """HMAC-SHA256 calculation"""
    if isinstance(key, str):
        key = key.encode('utf-8')
    if isinstance(msg, str):
        msg = msg.encode('utf-8')
    return hmac.new(key, msg, hashlib.sha256).digest()

def build_canonical_request(method, uri, query_params, headers, body=""):
    """Build CanonicalRequest for V3 signature"""
    # 1. CanonicalQueryString (sorted by parameter name)
    sorted_params = sorted(query_params.items())
    query_str = "&".join([f"{percent_encode(k)}={percent_encode(v)}" for k, v in sorted_params])
    
    # 2. HashedRequestPayload
    payload_hash = sha256_hex(body)
    headers['x-acs-content-sha256'] = payload_hash
    
    # 3. CanonicalHeaders (filter x-acs-, host, content-type)
    sign_headers = {}
    for k, v in headers.items():
        lk = k.lower()
        if lk.startswith('x-acs-') or lk == 'host' or lk == 'content-type':
            sign_headers[lk] = str(v).strip()
    
    sorted_keys = sorted(sign_headers.keys())
    canonical_headers = "\n".join([f"{k}:{sign_headers[k]}" for k in sorted_keys]) + "\n"
    signed_headers = ";".join(sorted_keys)
    
    # 4. Assemble CanonicalRequest
    canonical_req = f"{method}\n{uri}\n{query_str}\n{canonical_headers}\n{signed_headers}\n{payload_hash}"
    return canonical_req, signed_headers

def generate_v3_signature(access_key_id, access_key_secret, method, uri, query_params, headers, body=""):
    """Generate V3 signature"""
    # Ensure required headers exist
    headers['host'] = headers.get('host', DEFAULT_ENDPOINT)
    headers['x-acs-action'] = headers.get('x-acs-action', '')
    headers['x-acs-version'] = headers.get('x-acs-version', DEFAULT_VERSION)
    headers['x-acs-region-id'] = headers.get('x-acs-region-id', DEFAULT_REGION)
    
    if 'x-acs-date' not in headers:
        headers['x-acs-date'] = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    if 'x-acs-signature-nonce' not in headers:
        headers['x-acs-signature-nonce'] = str(uuid.uuid4())
    
    # Build CanonicalRequest
    canonical_req, signed_headers = build_canonical_request(method, uri, query_params, headers, body)
    
    # StringToSign
    string_to_sign = f"ACS3-HMAC-SHA256\n{sha256_hex(canonical_req)}"
    
    # Signature
    signature = hmac_sha256(access_key_secret, string_to_sign).hex().lower()
    
    # Authorization Header
    auth_header = f"ACS3-HMAC-SHA256 Credential={access_key_id},SignedHeaders={signed_headers},Signature={signature}"
    headers['Authorization'] = auth_header
    return headers

def call_das_agent_sse(query, session_id=None, agent_id=None, access_key_id=None, access_key_secret=None, endpoint=None, region=None, stream=True):
    """
    Call getDasAgentSSE API
    
    Args:
        query: Natural language query (required)
        session_id: Session ID (optional, UUID format)
        agent_id: Agent ID (optional)
        access_key_id: Alibaba Cloud AccessKey ID
        access_key_secret: Alibaba Cloud AccessKey Secret
        endpoint: API endpoint (default: das.cn-hangzhou.aliyuncs.com)
        region: Region ID (default: cn-hangzhou)
        stream: Whether to stream SSE response (default: True)
    
    Returns:
        If stream=True: yields SSE events as they arrive
        If stream=False: returns complete response as dict
    """
    # Get credentials from args or environment
    ak = access_key_id or os.getenv("ALICLOUD_ACCESS_KEY_ID")
    sk = access_key_secret or os.getenv("ALICLOUD_ACCESS_KEY_SECRET")
    if not ak or not sk:
        raise ValueError("AccessKey ID and Secret are required. Set them as arguments or environment variables.")
    
    ep = endpoint or DEFAULT_ENDPOINT
    reg = region or DEFAULT_REGION
    
    # Build query parameters
    query_params = {"Query": query}
    if session_id:
        query_params["SessionId"] = session_id
    if agent_id:
        query_params["AgentId"] = agent_id
    
    # Build headers
    headers = {
        "host": ep,
        "x-acs-action": "GetDasAgentSSE",
        "x-acs-version": DEFAULT_VERSION,
        "x-acs-region-id": reg,
        "Content-Type": "application/json"
    }
    
    # Generate signature
    headers = generate_v3_signature(ak, sk, "POST", "/", query_params, headers, body="")
    
    # Build URL
    url = f"https://{ep}/"
    
    # Make request
    response = requests.post(url, params=query_params, headers=headers, stream=stream, timeout=120)
    
    if response.status_code != 200:
        raise Exception(f"API call failed: {response.status_code} - {response.text}")
    
    if not stream:
        # Collect all SSE events and return combined answer
        full_answer = []
        session_id_result = None
        for line in response.iter_lines(decode_unicode=True):
            if line.startswith("data:"):
                try:
                    data = json.loads(line[5:])
                    if "Id" in data:
                        session_id_result = data["Id"]
                    if "Answer" in data and data["Answer"]:
                        full_answer.append(data["Answer"])
                except json.JSONDecodeError:
                    continue
        
        return {
            "session_id": session_id_result,
            "answer": "".join(full_answer)
        }
    
    return response

def list_rds_mysql_instances(access_key_id=None, access_key_secret=None, **kwargs):
    """
    List all RDS MySQL instances in the account
    """
    query = "列出所有RDS MySQL实例"
    return call_das_agent_sse(query, access_key_id=access_key_id, access_key_secret=access_key_secret, stream=False, **kwargs)

def main():
    parser = argparse.ArgumentParser(description="RDS MySQL Ops - DAS Agent API Client")
    parser.add_argument("--access-key-id", help="Alibaba Cloud AccessKey ID")
    parser.add_argument("--access-key-secret", help="Alibaba Cloud AccessKey Secret")
    parser.add_argument("--endpoint", default=DEFAULT_ENDPOINT, help="API endpoint")
    parser.add_argument("--region", default=DEFAULT_REGION, help="Region ID")
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # list-instances command
    list_parser = subparsers.add_parser("list-instances", help="List all RDS MySQL instances")
    
    args = parser.parse_args()
    
    # Get credentials
    ak = args.access_key_id or os.getenv("ALICLOUD_ACCESS_KEY_ID")
    sk = args.access_key_secret or os.getenv("ALICLOUD_ACCESS_KEY_SECRET")
    if not ak or not sk:
        print("Error: AccessKey ID and Secret are required.", file=sys.stderr)
        print("Set them via --access-key-id/--access-key-secret or environment variables.", file=sys.stderr)
        sys.exit(1)
    
    try:
        if args.command == "list-instances":
            result = list_rds_mysql_instances(ak, sk, endpoint=args.endpoint, region=args.region)
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            parser.print_help()
            sys.exit(1)
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()