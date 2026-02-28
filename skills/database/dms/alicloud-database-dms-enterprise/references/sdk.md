# DMS Enterprise Python SDK 说明

## 环境要求

- **Python >= 3.10**（本项目 pyproject.toml 声明 `requires-python = ">=3.10"`）
- 推荐使用虚拟环境以避免 PEP 668 系统级安装限制

## 包名

```
alibabacloud_dms_enterprise20181101
```

## 安装

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install "alibabacloud_dms_enterprise20181101>=1.72.0" alibabacloud_tea_openapi alibabacloud_credentials alibabacloud_tea_util
```

注意：运行脚本时使用 `.venv/bin/python`（避免找不到包的问题）。

## 核心依赖

| 包名 | 最低版本 | 用途 |
|---|---|---|
| `alibabacloud_dms_enterprise20181101` | `>=1.72.0` | DMS Enterprise 业务 SDK |
| `alibabacloud_tea_openapi` | — | OpenAPI 基础模型（Config 等） |
| `alibabacloud_credentials` | — | 统一凭证管理（环境变量 / 配置文件自动发现） |
| `alibabacloud_tea_util` | — | RuntimeOptions（超时、重试等工具模型） |

## 客户端初始化模板

```python
import os
from alibabacloud_dms_enterprise20181101.client import Client as DmsClient
from alibabacloud_tea_openapi import models as open_api_models


def create_client() -> DmsClient:
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
```

## 环境变量

| 变量名 | 必需 | 说明 |
|---|---|---|
| `ALICLOUD_ACCESS_KEY_ID` | 是 | RAM 用户 AccessKey ID |
| `ALICLOUD_ACCESS_KEY_SECRET` | 是 | RAM 用户 AccessKey Secret |
| `ALICLOUD_SECURITY_TOKEN` | 否 | STS 临时令牌 |
| `ALICLOUD_REGION_ID` | 否 | 默认地域（DMS 为全局服务，一般使用 cn-hangzhou） |

SDK 同时支持 `ALIBABA_CLOUD_*` 前缀的环境变量。

## Endpoint 说明

DMS Enterprise 是全局服务，endpoint 固定为：
```
dms-enterprise.cn-hangzhou.aliyuncs.com
```

## tid 参数

DMS Enterprise 大多数接口要求传入 `tid`（租户 ID）参数。普通用户可传 `0`（默认租户），多租户环境需传入具体的 tid 值。

## OpenAPI Explorer

如果 SDK 不可用或需要快速验证，可使用 OpenAPI Explorer：
- https://api.aliyun.com/product/dms-enterprise
- 选择版本 `2018-11-01`，选择接口后可在线调试并生成多语言 SDK 示例代码。

## aliyun CLI

作为 Python SDK 的替代方案，可使用 aliyun CLI 直接调用 DMS OpenAPI。

### 安装

```bash
# macOS
brew install aliyun-cli

# Linux（无 sudo）
curl -fsSL https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz -o /tmp/aliyun-cli.tgz
tar -xzf /tmp/aliyun-cli.tgz -C /tmp
mkdir -p ~/.local/bin && mv /tmp/aliyun ~/.local/bin/aliyun && chmod +x ~/.local/bin/aliyun
export PATH="$HOME/.local/bin:$PATH"
```

### 配置凭证

```bash
aliyun configure set --profile default --mode AK \
  --access-key-id "$ALICLOUD_ACCESS_KEY_ID" \
  --access-key-secret "$ALICLOUD_ACCESS_KEY_SECRET" \
  --region cn-hangzhou
```

### 常用命令

```bash
# 列出实例
aliyun dms-enterprise ListInstances --Tid 0

# 搜索数据库
aliyun dms-enterprise SearchDatabase --Tid 0 --SearchKey "order"

# 执行 SQL
aliyun dms-enterprise ExecuteScript --Tid 0 --DbId 12345 --Script "SELECT 1"
```

### 参考

- aliyun CLI 安装文档：https://help.aliyun.com/zh/cli/install-cli-on-linux
