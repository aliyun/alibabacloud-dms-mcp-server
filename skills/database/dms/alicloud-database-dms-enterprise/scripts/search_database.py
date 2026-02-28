#!/usr/bin/env python3
"""Search DMS databases by keyword.

Required env vars:
  ALICLOUD_ACCESS_KEY_ID / ALICLOUD_ACCESS_KEY_SECRET
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


def search_database(keyword: str) -> list[dict]:
    client = create_client()
    req = dms_models.SearchDatabaseRequest(search_key=keyword, tid=0)
    resp = client.search_database(req)
    records = []
    if resp.body.search_database_list and resp.body.search_database_list.search_database:
        for db in resp.body.search_database_list.search_database:
            records.append({
                "database_id": db.database_id,
                "schema_name": db.schema_name,
                "db_type": db.db_type,
                "host": db.host,
                "port": db.port,
                "encoding": db.encoding,
            })
    return records


def search_table(keyword: str) -> list[dict]:
    client = create_client()
    req = dms_models.SearchTableRequest(search_key=keyword, tid=0)
    resp = client.search_table(req)
    records = []
    if resp.body.search_table_list and resp.body.search_table_list.search_table:
        for t in resp.body.search_table_list.search_table:
            records.append({
                "table_id": t.table_id,
                "table_name": t.table_name,
                "database_id": t.database_id,
                "db_type": t.db_type,
                "table_schema_name": t.table_schema_name,
                "engine": t.engine,
            })
    return records


def main() -> int:
    parser = argparse.ArgumentParser(description="Search DMS databases/tables")
    parser.add_argument("keyword", help="Search keyword")
    parser.add_argument("--tables", action="store_true", help="Search tables instead of databases")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    args = parser.parse_args()

    if args.tables:
        records = search_table(args.keyword)
    else:
        records = search_database(args.keyword)

    if args.json:
        print(json.dumps(records, ensure_ascii=False, indent=2))
    else:
        for r in records:
            print("\t".join(str(v or "") for v in r.values()))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
