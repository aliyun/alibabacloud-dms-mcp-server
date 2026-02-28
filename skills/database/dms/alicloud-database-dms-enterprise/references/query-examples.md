# DMS Enterprise 查询示例

## 列出所有实例

```python
from alibabacloud_dms_enterprise20181101.client import Client as DmsClient
from alibabacloud_dms_enterprise20181101 import models as dms_models
from alibabacloud_tea_openapi import models as open_api_models
import os


def create_client() -> DmsClient:
    config = open_api_models.Config(
        access_key_id=os.getenv("ALICLOUD_ACCESS_KEY_ID"),
        access_key_secret=os.getenv("ALICLOUD_ACCESS_KEY_SECRET"),
        endpoint="dms-enterprise.cn-hangzhou.aliyuncs.com",
    )
    return DmsClient(config)


# 分页列出所有实例
client = create_client()
page = 1
while True:
    req = dms_models.ListInstancesRequest(tid=0, page_number=page, page_size=50)
    resp = client.list_instances(req)
    instances = resp.body.instance_list.instance if resp.body.instance_list else []
    for inst in instances:
        print(inst.instance_id, inst.host, inst.port, inst.instance_type, inst.state)
    if len(instances) < 50:
        break
    page += 1
```

## 搜索数据库 + 执行 SQL

```python
# 搜索包含 "order" 的数据库
req = dms_models.SearchDatabaseRequest(search_key="order", tid=0)
resp = client.search_database(req)
db = resp.body.search_database_list.search_database[0]
db_id = db.database_id

# 在该数据库上执行 SQL
req = dms_models.ExecuteScriptRequest(
    db_id=db_id,
    script="SELECT COUNT(*) AS cnt FROM orders WHERE status='pending'",
    logic=False,
    tid=0,
)
resp = client.execute_script(req)
for r in resp.body.results.result:
    print(f"Rows: {r.row_count}")
    if r.rows:
        for row in r.rows:
            print(row)
```

## 注册实例

```python
req = dms_models.RegisterInstanceRequest(
    tid=0,
    instance_type="MySQL",
    instance_source="PUBLIC_OWN",
    network_type="VPC",
    host="rm-xxx.mysql.rds.aliyuncs.com",
    port=3306,
    database_user="dms_user",
    database_password="your-password",
    region_id="cn-hangzhou",
    safe_rule_id="1",
)
resp = client.register_instance(req)
print(f"Request ID: {resp.body.request_id}, Success: {resp.body.success}")
```

## 查询用户权限

```python
req = dms_models.ListUserPermissionsRequest(
    tid=0,
    user_id="12345",
    page_number=1,
    page_size=50,
)
resp = client.list_user_permissions(req)
for perm in resp.body.user_permissions.user_permission:
    print(perm.ds_type, perm.database_id, perm.perm_type)
```

## 查询 SQL 审计日志

```python
req = dms_models.ListSQLExecAuditLogRequest(
    tid=0,
    start_time="2025-01-01 00:00:00",
    end_time="2025-01-02 00:00:00",
    page_number=1,
    page_size=20,
)
resp = client.list_sqlexec_audit_log(req)
for log in resp.body.sqlexec_audit_log_list.sqlexec_audit_log:
    print(log.op_time, log.user_name, log.sql, log.affect_rows)
```

## 查询表元数据

```python
req = dms_models.GetMetaTableDetailInfoRequest(
    tid=0,
    table_guid="mysql:12345:mydb.orders",
)
resp = client.get_meta_table_detail_info(req)
detail = resp.body.detail_info
print(f"Table: {detail.table_name}, Columns: {len(detail.column_list.column_info)}")
for col in detail.column_list.column_info:
    print(f"  {col.column_name} {col.column_type} nullable={col.nullable}")
```

## CLI 方式（aliyun CLI）

如果安装了 aliyun CLI，也可以直接调用：

```bash
# 列出实例
aliyun dms-enterprise ListInstances --Tid 0

# 搜索数据库
aliyun dms-enterprise SearchDatabase --Tid 0 --SearchKey "order"

# 执行 SQL
aliyun dms-enterprise ExecuteScript --Tid 0 --DbId 12345 --Script "SELECT 1"
```
