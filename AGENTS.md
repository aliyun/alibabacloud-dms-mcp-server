# Repository Guidelines

## Project Overview

This project serves a dual purpose:

1. **MCP Server**: A Python-based MCP (Model Context Protocol) Server for Alibaba Cloud DMS (Data Management Service), providing AI-powered unified data management gateway capabilities.
2. **Agent Skills**: A self-contained set of AI Agent skills for DMS Enterprise, enabling agents to directly manage DMS resources via OpenAPI without depending on MCP protocol.

These two capabilities are independent. The MCP Server is the original core, while the skills layer is an overlay that allows any AI agent (Codex, ChatGPT, Cursor, etc.) to use DMS skills natively.

## Project Structure & Module Organization

```
.
├── src/                           # MCP Server source code (Python)
│   ├── alibabacloud_dms_mcp_server/   # DMS MCP server
│   └── alibabacloud_dts_mcp_server/   # DTS MCP server
├── skills/                        # Agent Skills (independent of MCP)
│   ├── database/
│   │   └── dms/
│   │       └── alicloud-database-dms-enterprise/
│   │           ├── SKILL.md       # Skill definition & workflow (ENTRY POINT)
│   │           ├── agents/        # Agent interface config (openai.yaml)
│   │           ├── references/    # API sources, SDK docs, parameter reference, query examples
│   │           ├── scripts/       # Runnable scripts (list instances, search DB, execute SQL, API discovery)
│   │           └── output/        # Generated artifacts (API lists, docs)
│   ├── examples/                  # DMS 场景提示词样例
│   │   └── prompts/               # 按场景分类的提示词模板
│   └── scripts/                   # Skills maintenance tools
│       ├── generate_skill_index.py
│       ├── generate_readme_skill_sections.py
│       └── update_skill_index.sh
├── doc/                           # MCP Server documentation
├── tests/                         # Tests
├── pyproject.toml                 # Python project config
└── README.md                      # Project README
```

## Using Skills (for AI Agents)

### Environment Requirements

- **Python >= 3.10**（本项目 `pyproject.toml` 声明 `requires-python = ">=3.10"`，低版本不兼容）
- 推荐在虚拟环境中操作（避免 PEP 668 系统级安装限制）：
  ```bash
  python3 -m venv .venv
  . .venv/bin/activate
  ```
- 运行 scripts/ 中的脚本时，使用 `.venv/bin/python` 以确保依赖可用。

### SDK & CLI Installation

#### Python SDK（首选）

```bash
pip install "alibabacloud_dms_enterprise20181101>=1.72.0" alibabacloud_tea_openapi alibabacloud_credentials alibabacloud_tea_util
```

| 包名 | 用途 |
|---|---|
| `alibabacloud_dms_enterprise20181101>=1.72.0` | DMS Enterprise 业务 SDK（与 pyproject.toml 版本一致） |
| `alibabacloud_tea_openapi` | OpenAPI 基础模型（Config / Client 等） |
| `alibabacloud_credentials` | 统一凭证管理（环境变量 / 配置文件自动发现） |
| `alibabacloud_tea_util` | RuntimeOptions（超时、重试等） |

#### aliyun CLI（轻量操作或脚本集成）

```bash
# macOS
brew install aliyun-cli

# Linux (无 sudo)
curl -fsSL https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz -o /tmp/aliyun-cli.tgz
tar -xzf /tmp/aliyun-cli.tgz -C /tmp
mkdir -p ~/.local/bin && mv /tmp/aliyun ~/.local/bin/aliyun && chmod +x ~/.local/bin/aliyun
export PATH="$HOME/.local/bin:$PATH"
```

配置 CLI 凭证：

```bash
aliyun configure set --profile default --mode AK \
  --access-key-id "$ALICLOUD_ACCESS_KEY_ID" \
  --access-key-secret "$ALICLOUD_ACCESS_KEY_SECRET" \
  --region cn-hangzhou
```

CLI 快速验证：

```bash
aliyun dms-enterprise ListInstances --Tid 0
aliyun dms-enterprise SearchDatabase --Tid 0 --SearchKey "order"
aliyun dms-enterprise ExecuteScript --Tid 0 --DbId 12345 --Script "SELECT 1"
```

#### OpenAPI Explorer（在线调试和代码生成）

- https://api.aliyun.com/product/dms-enterprise
- 选择版本 `2018-11-01`，选择接口后可在线调试并生成多语言 SDK 示例代码。

### Skill Discovery

- All skills live under `skills/`. Each skill has a `SKILL.md` as its entry point.
- The DMS Enterprise skill is at: `skills/database/dms/alicloud-database-dms-enterprise/SKILL.md`
- Read `SKILL.md` first to understand the skill's capabilities, workflow, and API mappings.

### Skill Execution Flow

1. Read the `SKILL.md` to understand available operations, SDK quickstart, and inline code examples.
2. Set up environment (if not already done):
   ```bash
   python3 -m venv .venv && . .venv/bin/activate
   pip install "alibabacloud_dms_enterprise20181101>=1.72.0" alibabacloud_tea_openapi alibabacloud_credentials alibabacloud_tea_util
   ```
3. Configure authentication via environment variables (`ALICLOUD_ACCESS_KEY_ID` / `ALICLOUD_ACCESS_KEY_SECRET`) or `~/.alibabacloud/credentials`.
4. Use runnable scripts for common operations:
   - `.venv/bin/python scripts/list_instances.py` — List all DMS-registered instances (TSV/JSON)
   - `.venv/bin/python scripts/search_database.py "order"` — Search databases/tables by keyword
   - `.venv/bin/python scripts/execute_script.py --db-id 12345 --sql "SELECT 1"` — Execute SQL
   - `.venv/bin/python scripts/list_openapi_meta_apis.py` — Discover the full API surface (299 APIs)
5. Check `references/` for API parameter quick reference (`api_reference.md`), SDK docs (`sdk.md`), and query examples (`query-examples.md`).
6. Save any generated output to `output/alicloud-database-dms-enterprise/`.

### AccessKey Configuration (Must Follow)

1. Environment variables (priority): `ALICLOUD_ACCESS_KEY_ID` / `ALICLOUD_ACCESS_KEY_SECRET` / `ALICLOUD_REGION_ID`
   - Also supported: `ALIBABA_CLOUD_ACCESS_KEY_ID` / `ALIBABA_CLOUD_ACCESS_KEY_SECRET` (SDK 兼容)
   - STS Token: `ALICLOUD_SECURITY_TOKEN` 或 `ALIBABA_CLOUD_SECURITY_TOKEN`
   - Region rule: `ALICLOUD_REGION_ID` is an optional default; if unset, pick the most reasonable region or ask the user.
2. Fallback: `~/.alibabacloud/credentials`
   ```ini
   [default]
   type = access_key
   access_key_id = your-ak
   access_key_secret = your-sk
   ```

### Key Skill: alicloud-database-dms-enterprise

Capabilities include:
- Instance management: register, list, update, delete database instances
- SQL execution & audit: execute scripts, NL2SQL, SQL review
- Permission management: create permission orders, grant/revoke user permissions
- Data security: sensitive column identification, data masking, audit logs
- Task orchestration: create/execute/monitor task flows
- Metadata knowledge: get/edit table business knowledge

### Prompt Examples

See `skills/examples/prompts/` for DMS scenario-based prompt templates:
- `instance-management.md` - Instance registration, query & metadata
- `sql-execution-audit.md` - SQL execution, review & audit logs
- `permission-security.md` - Permission grant/revoke, sensitive data & audit
- `task-orchestration.md` - Task flows (DAG), data change orders & exports
- `api-discovery.md` - OpenAPI metadata discovery & business knowledge

## Using MCP Server (for MCP Clients)

The MCP Server provides tools like `addInstance`, `executeScript`, `nl2sql`, etc. See `README.md` for full MCP setup and configuration.

## Build, Test, and Development Commands

### MCP Server

```bash
# Install dependencies
uv sync

# Run tests
uv run pytest

# Run server locally
uv run src/alibabacloud_dms_mcp_server/server.py
```

### Skills Usage

```bash
# 1. 创建虚拟环境并安装依赖（首次）
python3 -m venv .venv
. .venv/bin/activate
pip install "alibabacloud_dms_enterprise20181101>=1.72.0" alibabacloud_tea_openapi alibabacloud_credentials alibabacloud_tea_util

# 2. 配置凭证
export ALICLOUD_ACCESS_KEY_ID="your-ak"
export ALICLOUD_ACCESS_KEY_SECRET="your-sk"

# 3. 运行脚本（注意使用 .venv/bin/python）
.venv/bin/python skills/database/dms/alicloud-database-dms-enterprise/scripts/list_instances.py
.venv/bin/python skills/database/dms/alicloud-database-dms-enterprise/scripts/search_database.py "order"
.venv/bin/python skills/database/dms/alicloud-database-dms-enterprise/scripts/execute_script.py --db-id 12345 --sql "SELECT 1"
.venv/bin/python skills/database/dms/alicloud-database-dms-enterprise/scripts/list_openapi_meta_apis.py

# 或者使用 aliyun CLI（无需 Python 依赖）
aliyun dms-enterprise ListInstances --Tid 0
aliyun dms-enterprise SearchDatabase --Tid 0 --SearchKey "order"
```

### Skills Maintenance

```bash
skills/scripts/update_skill_index.sh
```

## Coding Style & Naming Conventions

- Python: 4-space indentation, type hints where practical, small focused functions.
- Skill folders use kebab-case, prefixed by product scope (e.g., `alicloud-database-dms-enterprise`).
- Keep frontmatter in every `SKILL.md` with at least `name` and `description`.

## Commit & Pull Request Guidelines

- Follow Conventional Commit style: `feat: ...`, `chore: ...`, `refactor(scope): ...`, `docs: ...`.
- Keep commits scoped to one concern (MCP server code, skill content, scripts, or docs).
- When skill inventory changes, ensure README skill sections are refreshed via `scripts/update_skill_index.sh`.
