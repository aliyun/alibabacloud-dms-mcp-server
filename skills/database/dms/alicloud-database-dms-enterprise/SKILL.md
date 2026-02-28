---
name: alicloud-database-dms-enterprise
description: Manage Alibaba Cloud Data Management Service (DMS Enterprise) via OpenAPI. Use for database instance management, SQL audit, data security, task orchestration, sensitive data protection, permission management, and database operation workflows.
---

Category: service

# 阿里云数据管理服务 DMS Enterprise

使用阿里云数据管理服务（DMS）OpenAPI 管理数据库实例、执行 SQL 审计、数据安全防护、任务编排、敏感数据保护、权限管理等数据库运维和管理任务。

## 前置要求

- **Python >= 3.10**（本项目 pyproject.toml 声明 `requires-python = ">=3.10"`）。
- 使用 RAM 用户/角色最小权限的 AccessKey，优先从环境变量读取 AK/SK。
- OpenAPI 为 RPC 签名机制，优先使用官方 SDK 或 OpenAPI Explorer 或 aliyun CLI。
- 确保 RAM 用户具有 DMS 相关权限（如 AliyunDMSFullAccess 或自定义权限策略）。

## SDK 优先级

1) Python SDK（首选）
2) aliyun CLI（轻量操作或脚本集成）
3) OpenAPI Explorer（在线调试和代码生成）

### Python SDK 安装

推荐使用虚拟环境（避免 PEP 668 的系统安装限制）。

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install "alibabacloud_dms_enterprise20181101>=1.72.0" alibabacloud_tea_openapi alibabacloud_credentials alibabacloud_tea_util
```

注意事项：
- 必须使用 Python 3.10+，低版本不兼容。
- `alibabacloud_dms_enterprise20181101>=1.72.0` 为推荐最低版本（与 pyproject.toml 一致）。
- `alibabacloud_credentials` 提供统一凭证管理（环境变量 / 配置文件自动发现）。
- `alibabacloud_tea_util` 提供 RuntimeOptions（设置超时、重试等）。
- 运行脚本时请使用 venv 内的 Python：`.venv/bin/python scripts/list_instances.py`

### aliyun CLI 安装（可选，无 sudo）

```bash
# macOS
brew install aliyun-cli

# Linux
curl -fsSL https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz -o /tmp/aliyun-cli.tgz
tar -xzf /tmp/aliyun-cli.tgz -C /tmp
mkdir -p ~/.local/bin
mv /tmp/aliyun ~/.local/bin/aliyun
chmod +x ~/.local/bin/aliyun
export PATH="$HOME/.local/bin:$PATH"
```

配置 CLI 凭证：

```bash
aliyun configure set \
  --profile default \
  --mode AK \
  --access-key-id "$ALICLOUD_ACCESS_KEY_ID" \
  --access-key-secret "$ALICLOUD_ACCESS_KEY_SECRET" \
  --region cn-hangzhou
```

CLI 快速验证：

```bash
# 列出实例
aliyun dms-enterprise ListInstances --Tid 0

# 搜索数据库
aliyun dms-enterprise SearchDatabase --Tid 0 --SearchKey "order"

# 执行 SQL
aliyun dms-enterprise ExecuteScript --Tid 0 --DbId 12345 --Script "SELECT 1"
```

### Python SDK quickstart（列出实例）

```python
import os
from alibabacloud_dms_enterprise20181101.client import Client as DmsClient
from alibabacloud_dms_enterprise20181101 import models as dms_models
from alibabacloud_tea_openapi import models as open_api_models


def create_client() -> DmsClient:
    """创建 DMS 客户端，从环境变量读取凭证。"""
    ak = os.getenv("ALICLOUD_ACCESS_KEY_ID") or os.getenv("ALIBABA_CLOUD_ACCESS_KEY_ID")
    sk = os.getenv("ALICLOUD_ACCESS_KEY_SECRET") or os.getenv("ALIBABA_CLOUD_ACCESS_KEY_SECRET")
    token = os.getenv("ALICLOUD_SECURITY_TOKEN") or os.getenv("ALIBABA_CLOUD_SECURITY_TOKEN")
    config = open_api_models.Config(
        access_key_id=ak,
        access_key_secret=sk,
        endpoint="dms-enterprise.cn-hangzhou.aliyuncs.com",
    )
    if token:
        config.security_token = token
    return DmsClient(config)


def list_instances():
    client = create_client()
    req = dms_models.ListInstancesRequest(tid=0)
    resp = client.list_instances(req)
    for inst in resp.body.instance_list.instance:
        print(inst.instance_id, inst.host, inst.port, inst.instance_type, inst.state)


if __name__ == "__main__":
    list_instances()
```

### Python SDK: 搜索数据库

```python
def search_database(keyword: str):
    client = create_client()
    req = dms_models.SearchDatabaseRequest(search_key=keyword, tid=0)
    resp = client.search_database(req)
    for db in resp.body.search_database_list.search_database:
        print(db.database_id, db.schema_name, db.db_type, db.host, db.port)
```

### Python SDK: 执行 SQL 脚本

```python
def execute_script(db_id: int, sql: str):
    client = create_client()
    req = dms_models.ExecuteScriptRequest(
        db_id=db_id,
        script=sql,
        logic=False,
        tid=0,
    )
    resp = client.execute_script(req)
    for result in resp.body.results.result:
        print(f"Rows: {result.row_count}, Columns: {result.column_names}")
```

### Python SDK: 查询用户权限

```python
def list_user_permissions(user_id: str):
    client = create_client()
    req = dms_models.ListUserPermissionsRequest(
        user_id=user_id,
        tid=0,
        page_number=1,
        page_size=50,
    )
    resp = client.list_user_permissions(req)
    for perm in resp.body.user_permissions.user_permission:
        print(perm.ds_type, perm.database_id, perm.perm_type)
```

### Python SDK scripts（推荐用于批量操作）

- 列出所有实例：`scripts/list_instances.py`
- 搜索数据库/表：`scripts/search_database.py`
- 执行 SQL 脚本：`scripts/execute_script.py`
- API 清单发现：`scripts/list_openapi_meta_apis.py`

## 工作流

1) 明确操作类型：实例注册 / SQL 执行 / 数据导出导入 / 权限管理 / 安全审计 / 任务编排。
2) 在 `references/sources.md` 中查找相关 API 接口。
3) 选择调用方式（SDK / OpenAPI Explorer / CLI）。
4) 执行操作后，使用查询类接口验证结果和状态。

## AccessKey 读取优先级（必须遵循）

1) 环境变量（优先）：`ALICLOUD_ACCESS_KEY_ID` / `ALICLOUD_ACCESS_KEY_SECRET` / `ALICLOUD_REGION_ID`
   Region 规则：`ALICLOUD_REGION_ID` 作为可选默认值；若未设置，执行时应选择最合理的 Region，无法判断则主动询问。
2) 标准配置文件：`~/.alibabacloud/credentials`

### 认证设置

环境变量：

```bash
export ALICLOUD_ACCESS_KEY_ID="your-ak"
export ALICLOUD_ACCESS_KEY_SECRET="your-sk"
export ALICLOUD_REGION_ID="cn-hangzhou"
```

SDK 也支持 ALIBABA_CLOUD 前缀：

```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID="your-ak"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your-sk"
```

共享配置文件：

`~/.alibabacloud/credentials`

```ini
[default]
type = access_key
access_key_id = your-ak
access_key_secret = your-sk
```

## Region 默认策略

- 如未指定 Region，优先选择最合理 Region；无法判断则询问用户。
- DMS 是全局服务，部分接口不需要指定 Region，但数据库实例需要关联具体地域。
- 若用户提供 Region，则只操作指定 Region 的资源。

## API 发现

- 产品代码：`dms-enterprise`
- 推荐 API 版本：`2018-11-01`
- 使用 OpenAPI 元数据端点列出 API 列表和获取 Schema（参见 references）。

## 常见操作映射

### 实例管理
- 注册实例：`RegisterInstance`
- 查询实例列表：`ListInstances` / `SearchDatabase`
- 修改实例配置：`UpdateInstance`
- 删除实例：`DeleteInstance`

### SQL 执行与查询
- 执行 SQL：`ExecuteDataCorrect` / `ExecuteScript`
- 查询数据：`ExecuteDataExport`
- SQL 审计：`ListSQLReviewOriginSQLs` / `GetSQLReviewOptimizeDetail`

### 权限管理
- 申请权限：`CreateOrder`（创建权限工单）
- 授权管理：`GrantUserPermission` / `RevokeUserPermission`
- 查询权限：`ListUserPermissions` / `ListDatabaseUserPermissions`

### 数据安全与审计
- 敏感数据识别：`IdentifyRulesType`
- 数据脱敏：`ListSensitiveColumns` / `ModifySensitiveColumns`
- 操作日志审计：`GetOpLog` / `ListWorkFlowTemplates`

### 任务编排
- 创建任务流：`CreateTaskFlow`
- 执行任务流：`ExecuteDagNode`
- 查询任务状态：`GetTaskFlowGraph` / `ListTaskFlow`

### 元数据的业务知识
- 获取业务知识：`GetTableKnowledgeInfo`
- 编辑业务知识：`EditMetaKnowledgeAsset`


## 高频操作模式

1) 库表查询：使用 `SearchDatabase` / `SearchTable` 列出当前实例的库表资源。
2) 数据变更：通过 `CreateOrder` 创建数据变更工单，审批后执行。
3) 权限申请：使用 `CreateOrder` 创建权限申请工单，审批通过后授权。
4) SQL 审核：先通过 `GetSQLReviewCheckResultStatus` 获取 SQL 审核结果，再执行变更。

## 最小可执行快速开始

使用元数据优先发现方式，先列出 API 清单再调用业务接口：

```bash
python scripts/list_openapi_meta_apis.py
```

可选覆盖参数：

```bash
python scripts/list_openapi_meta_apis.py --product-code dms-enterprise --version 2018-11-01
```

脚本会将 API 清单保存到 skill output 目录。

## 选择问题（不确定时提问）

1. 要管理的数据库实例类型是什么？（MySQL / PostgreSQL / SQL Server / Redis 等）
2. 操作目标是什么？（注册实例 / 执行 SQL / 数据导出 / 权限管理 / 安全审计）
3. 是否需要工单审批流程？
4. 目标实例所在地域是什么？

## Output Policy

若需保存响应或生成文件，写入：
`output/alicloud-database-dms-enterprise/`

## References

- API 来源与版本信息：`references/sources.md`
- SDK 说明与安装：`references/sdk.md`
- API 参数速查：`references/api_reference.md`
- 查询示例：`references/query-examples.md`
