#!/usr/bin/env python3
"""List all DMS-registered database instances.

Outputs TSV by default. Use --json for JSON output.

Required env vars:
  ALICLOUD_ACCESS_KEY_ID / ALICLOUD_ACCESS_KEY_SECRET
  (or ALIBABA_CLOUD_ACCESS_KEY_ID / ALIBABA_CLOUD_ACCESS_KEY_SECRET)
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


def list_all_instances() -> list[dict]:
    client = create_client()
    records = []
    page = 1
    page_size = 50
    while True:
        req = dms_models.ListInstancesRequest(
            tid=0,
            page_number=page,
            page_size=page_size,
        )
        resp = client.list_instances(req)
        if not resp.body.instance_list or not resp.body.instance_list.instance:
            break
        for inst in resp.body.instance_list.instance:
            records.append({
                "instance_id": inst.instance_id,
                "host": inst.host,
                "port": inst.port,
                "instance_type": inst.instance_type,
                "instance_alias": inst.instance_alias,
                "state": inst.state,
                "database_user": inst.database_user,
            })
        if len(resp.body.instance_list.instance) < page_size:
            break
        page += 1
    return records


def main() -> int:
    parser = argparse.ArgumentParser(description="List DMS instances")
    parser.add_argument("--json", action="store_true", help="Output JSON array")
    parser.add_argument("--output", help="Write output to file")
    args = parser.parse_args()

    records = list_all_instances()

    if args.json:
        output = json.dumps(records, ensure_ascii=False, indent=2)
    else:
        header = "instance_id\thost\tport\tinstance_type\tinstance_alias\tstate"
        lines = [header]
        for r in records:
            lines.append("\t".join([
                str(r.get("instance_id") or ""),
                str(r.get("host") or ""),
                str(r.get("port") or ""),
                str(r.get("instance_type") or ""),
                str(r.get("instance_alias") or ""),
                str(r.get("state") or ""),
            ]))
        output = "\n".join(lines)

    if args.output:
        from pathlib import Path
        Path(args.output).parent.mkdir(parents=True, exist_ok=True)
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output)
        print(f"Saved: {args.output}")
    else:
        print(output)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
