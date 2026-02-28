#!/usr/bin/env python3
"""Execute a SQL script via DMS and print the result.

Required env vars:
  ALICLOUD_ACCESS_KEY_ID / ALICLOUD_ACCESS_KEY_SECRET

Usage:
  python execute_script.py --db-id 12345 --sql "SELECT COUNT(*) FROM orders"
  python execute_script.py --db-id 12345 --file query.sql
"""

from __future__ import annotations

import argparse
import json
import os
import sys

from alibabacloud_dms_enterprise20181101.client import Client as DmsClient
from alibabacloud_dms_enterprise20181101 import models as dms_models
from alibabacloud_tea_openapi import models as open_api_models


def create_client() -> DmsClient:
    ak = os.getenv("ALICLOUD_ACCESS_KEY_ID") or os.getenv("ALIBABA_CLOUD_ACCESS_KEY_ID")
    sk = os.getenv("ALICLOUD_ACCESS_KEY_SECRET") or os.getenv("ALIBABA_CLOUD_ACCESS_KEY_SECRET")
    token = os.getenv("ALICLOUD_SECURITY_TOKEN") or os.getenv("ALIBABA_CLOUD_SECURITY_TOKEN")
    if not ak or not sk:
        print("Missing ALICLOUD_ACCESS_KEY_ID / ALICLOUD_ACCESS_KEY_SECRET", file=sys.stderr)
        sys.exit(1)
    config = open_api_models.Config(
        access_key_id=ak,
        access_key_secret=sk,
        endpoint="dms-enterprise.cn-hangzhou.aliyuncs.com",
    )
    if token:
        config.security_token = token
    return DmsClient(config)


def execute_script(db_id: int, sql: str, logic: bool = False) -> dict:
    client = create_client()
    req = dms_models.ExecuteScriptRequest(
        db_id=db_id,
        script=sql,
        logic=logic,
        tid=0,
    )
    resp = client.execute_script(req)
    results = []
    if resp.body.results and resp.body.results.result:
        for r in resp.body.results.result:
            results.append({
                "success": r.success,
                "row_count": r.row_count,
                "column_names": r.column_names,
                "rows": r.rows,
                "message": r.message,
            })
    return {
        "request_id": resp.body.request_id,
        "success": resp.body.success,
        "results": results,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Execute SQL via DMS")
    parser.add_argument("--db-id", type=int, required=True, help="DMS database ID")
    parser.add_argument("--sql", help="SQL statement to execute")
    parser.add_argument("--file", help="Read SQL from file")
    parser.add_argument("--logic", action="store_true", help="Use logic database mode")
    parser.add_argument("--json", action="store_true", help="Output raw JSON response")
    args = parser.parse_args()

    if args.file:
        with open(args.file, "r", encoding="utf-8") as f:
            sql = f.read()
    elif args.sql:
        sql = args.sql
    else:
        print("Either --sql or --file is required", file=sys.stderr)
        return 1

    result = execute_script(args.db_id, sql, logic=args.logic)

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        for r in result["results"]:
            if r.get("success"):
                print(f"Rows: {r.get('row_count')}")
                if r.get("column_names"):
                    print("\t".join(str(c) for c in r["column_names"]))
                if r.get("rows"):
                    for row in r["rows"]:
                        print("\t".join(str(v) for v in row))
            else:
                print(f"Error: {r.get('message')}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
