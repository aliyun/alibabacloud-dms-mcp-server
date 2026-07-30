#!/usr/bin/env python3
"""
RDS MySQL Instances Query Script
Uses the DAS Agent API to query RDS MySQL instances.
"""

import sys
import os

# Add the das-agent scripts directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'das-agent', 'scripts'))

try:
    from das_agent import call_das_agent_sse
    
    def query_rds_mysql_instances():
        """Query all RDS MySQL instances"""
        query = "请列出我账号下的所有RDS MySQL实例"
        result = call_das_agent_sse(query, stream=False)
        return result
    
    if __name__ == "__main__":
        try:
            result = query_rds_mysql_instances()
            print("✅ 查询成功!")
            print(result["answer"])
        except Exception as e:
            print(f"❌ 查询失败: {e}", file=sys.stderr)
            sys.exit(1)
            
except ImportError:
    # Fallback: use direct implementation
    print("Warning: Could not import das_agent, using direct implementation", file=sys.stderr)
    
    import json
    import os
    import sys
    import uuid
    from datetime import datetime, timezone
    from urllib.parse import quote_plus
    import requests
    import hashlib
    import hmac

    # Default configuration
    DEFAULT_ENDPOINT = "das.cn-hangzhou.aliyuncs.com"
    DEFAULT_VERSION = "2020-01-16"
    DEFAULT_REGION = "cn-hangzhou"

    def percent_encode(s):
        if not s:
            return ""
        encoded = quote_plus(str(s), safe='-_.~')
        return encoded.replace('+', '%20').replace('*', '%2A').replace('%7E', '~')

    def sha256_hex(data):
        if isinstance(data, str):
            data = data.encode('utf-8')
        return hashlib.sha256(data).hexdigest().lower()

    def hmac_sha256(key, msg):
        if isinstance(key, str):
            key = key.encode('utf-8')
        if isinstance(msg, str):
            msg = msg.encode('utf-8')
        return hmac.new(key, msg, hashlib.sha256).digest()

    def build_canonical_request(method, uri, query_params, headers, body=""):
        sorted_params = sorted(query_params.items())
        query_str = "&".join([f"{percent_encode(k)}={percent_encode(v)}" for k, v in sorted_params])
        payload_hash = sha256_hex(body)
        headers['x-acs-content-sha256'] = payload_hash
        
        sign_headers = {}
        for k, v in headers.items():
            lk = k.lower()
            if lk.startswith('x-acs-') or lk == 'host' or lk == 'content-type':
                sign_headers[lk] = str(v).strip()
        
        sorted_keys = sorted(sign_headers.keys())
        canonical_headers = "\n".join([f"{k}:{sign_headers[k]}" for k in sorted_keys]) + "\n"
        signed_headers = ";".join(sorted_keys)
        
        canonical_req = f"{method}\n{uri}\n{query_str}\n{canonical_headers}\n{signed_headers}\n{payload_hash}"
        return canonical_req, signed_headers

    def generate_v3_signature(access_key_id, access_key_secret, method, uri, query_params, headers, body=""):
        headers['host'] = headers.get('host', DEFAULT_ENDPOINT)
        headers['x-acs-action'] = headers.get('x-acs-action', 'getDasAgentSSE')
        headers['x-acs-version'] = headers.get('x-acs-version', DEFAULT_VERSION)
        
        if 'x-acs-date' not in headers:
            headers['x-acs-date'] = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        if 'x-acs-signature-nonce' not in headers:
            headers['x-acs-signature-nonce'] = str(uuid.uuid4())
        if 'x-acs-region-id' not in headers:
            headers['x-acs-region-id'] = DEFAULT_REGION
        
        canonical_req, signed_headers = build_canonical_request(method, uri, query_params, headers, body)
        string_to_sign = f"ACS3-HMAC-SHA256\n{sha256_hex(canonical_req)}"
        signature = hmac_sha256(access_key_secret, string_to_sign).hex().lower()
        auth_header = f"ACS3-HMAC-SHA256 Credential={access_key_id},SignedHeaders={signed_headers},Signature={signature}"
        headers['Authorization'] = auth_header
        return headers

    def call_das_agent_sse_direct(query, stream=False):
        ak = os.getenv("ALIBABA_CLOUD_ACCESS_KEY_ID")
        sk = os.getenv("ALIBABA_CLOUD_ACCESS_KEY_SECRET")
        if not ak or not sk:
            raise ValueError("AccessKey ID and Secret are required.")
        
        ep = DEFAULT_ENDPOINT
        reg = DEFAULT_REGION
        
        query_params = {"Query": query}
        headers = {
            "host": ep,
            "x-acs-action": "getDasAgentSSE",
            "x-acs-version": DEFAULT_VERSION,
            "x-acs-region-id": reg,
            "Content-Type": "application/json"
        }
        
        headers = generate_v3_signature(ak, sk, "POST", "/", query_params, headers, body="")
        url = f"https://{ep}/"
        
        response = requests.post(url, params=query_params, headers=headers, stream=stream, timeout=120)
        if response.status_code != 200:
            raise Exception(f"API call failed: {response.status_code} - {response.text}")
        
        if not stream:
            full_answer = []
            for line in response.iter_lines(decode_unicode=True):
                if line.startswith("data:"):
                    try:
                        data = json.loads(line[5:])
                        if "Answer" in data and data["Answer"]:
                            full_answer.append(data["Answer"])
                    except json.JSONDecodeError:
                        continue
            return {"answer": "".join(full_answer)}
        
        return response

    if __name__ == "__main__":
        try:
            result = call_das_agent_sse_direct("请列出我账号下的所有RDS MySQL实例", stream=False)
            print("✅ 查询成功!")
            print(result["answer"])
        except Exception as e:
            print(f"❌ 查询失败: {e}", file=sys.stderr)
            sys.exit(1)