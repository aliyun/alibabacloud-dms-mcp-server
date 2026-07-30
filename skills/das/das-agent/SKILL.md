# 数据库运维 DAS Agent Skill

## 描述

通过自然语言诊断和管理阿里云数据库。当用户需要排查数据库性能问题（CPU 过高、慢 SQL、连接数异常、锁等待）、查看实例状态、分析磁盘空间、优化 SQL、执行健康巡检或检测安全基线违规时，请使用本技能。支持 RDS（MySQL/PostgreSQL/SQL Server）、PolarDB、MongoDB、Redis（Tair）和 Lindorm。

即使是口语化描述，如"我的数据库变慢了"、"数据库连不上"、"帮我看看这条 SQL"或"数据库磁盘快满了"，也应触发本技能。同样适用于咨询阿里云特有的数据库功能（如 PolarDB Serverless、DAS 自治能力）以及产品对比（RDS vs PolarDB）。

本技能同样支持 IDC、自建、非阿里云的 MySQL/PG/Redis/MongoDB/OB MySQL/SQL Server 实例。

## 元数据

```yaml
name: database-operations-das
description: 通过自然语言诊断和管理阿里云数据库（DAS 服务）
license: Apache-2.0
compatibility: >
  需要 uv（Python 包管理器）以及对 das.cn-shanghai.aliyuncs.com 的 HTTPS 访问权限。
  需要通过默认凭据链提供阿里云访问凭据（AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess 权限）。
  DAS Agent ID 为可选项。
metadata:
  async: true
  timeout: 1800
required_permissions:
  - "das:Chat"
```

## 计费与免费额度

本服务为付费服务，提供试用免费额度。

- **免费额度**：未设置 Agent ID 时，脚本将省略 AgentId 参数，API 将使用默认 Agent ID，该默认 ID 附带有限的免费试用配额。
- **付费使用**：如需用于生产环境或更高使用量，请购买 DAS Agent 订阅，并设置您自己的 Agent ID 以绑定专属 Agent 和配额。
- **环境变量**：支持 `ALIBABA_CLOUD_DAS_AGENT_ID` 或 `AGENT_ID`（两者任一即可）。

**建议**：先通过免费额度（默认 Agent ID）评估服务效果。决定投入生产使用后，再购买订阅并配置您自己的 Agent ID。

购买链接：
- **中国站用户**（uid 为 1、2 开头）：https://common-buy.aliyun.com/?commodityCode=hdm_dasagent_public_cn
- **国际站用户**（uid 为 5 开头）：https://common-buy.aliyun.com/?commodityCode=hdm_dasagent_public_intl

## 环境变量

脚本需要通过阿里云凭据 SDK 解析访问凭据。DAS Agent ID 为可选项——若未提供，则省略 AgentId 参数，API 将使用具有有限免费配额的默认 Agent ID。

```bash
# 可选：购买 DAS Agent 服务后设置您自己的 Agent ID
export ALIBABA_CLOUD_DAS_AGENT_ID="<agent_id>"  # 从 DAS 控制台获取（可选）
# 或使用简写形式
export AGENT_ID="<agent_id>"  # 与 ALIBABA_CLOUD_DAS_AGENT_ID 等效

# 阿里云凭据 SDK 会自动从多个来源解析凭据
# 请参阅 https://www.alibabacloud.com/help/en/sdk/developer-reference/v2-manage-python-access-credentials
```

如果您已购买 DAS Agent 订阅，请前往以下地址创建和管理您的 Agent ID：
https://das.console.aliyun.com/

## 使用示例

### 基本调用

```bash
cd /home/admin/.openclaw/workspace/skills/database-operations-das/scripts

# 管道模式（推荐用于 Agent 调用）——进度输出到 stderr，答案通过明确分隔符输出到 stdout
uv run call_das_agent.py --question "<用户问题>" --pipe

# 默认模式（命令行对话界面）——实时流式输出，包含工具调用详情
uv run call_das_agent.py --question "<用户问题>"

# JSON 模式——机器可读的 JSONL 格式，每行一个 JSON 对象输出到 stdout
uv run call_das_agent.py --question "<用户问题>" --json
```

### 多轮对话

```bash
# 第一行返回 session_id
uv run call_das_agent.py --question "列出我的实例" --pipe

# 提取 session_id（以 "SESSION:" 开头的行），然后复用：
uv run call_das_agent.py --question "检查第一个实例" --session "<上面获取的 session_id>" --pipe
```

**作为 Agent 调用时请始终使用 `--pipe` 模式**。该模式将所有进度信息和工具调用噪声路由到 stderr，仅将 DAS 答案通过明确分隔符写入 stdout，确保真实响应清晰可辨。

需要程序化解析响应时，优先使用 `--json` 模式。

## 行为说明

DAS Agent 在内部会编排多次 API 调用和工具调用来回答单个问题，这带来以下重要影响：

### 1. 长时运行任务

复杂诊断（多实例巡检、全面健康检查、批量 SQL 分析）可能耗时数分钟乃至 30 分钟，因为 DAS Agent 需要依次调用监控 API、执行诊断并综合分析结果。请在开始前告知用户，并定期提供进度更新。

### 2. 实例接入

目标数据库实例必须已加入 DAS Agent 管理。如果出现错误码 `-1810006`，表示该 Agent 尚未关联任何实例——请引导用户前往以下地址关联实例：
https://das.console.aliyun.com/?aes_debug=#/das-agent?currentView=settings

### 3. 实例 ID

DAS Agent 通过实例 ID（如 `your-instance-id`、`your-instance-id`）定位实例。提问时请始终包含具体的实例 ID 以确保结果准确。如果用户未提供，请先询问，或先查询实例列表。

### 4. 并行执行

诊断多个实例时，可并行启动多个脚本进程——每次调用相互独立、无状态（除非共享会话 ID）。

### 5. 多轮对话——关联问题必须复用会话 ID

如果用户的问题具有连续性或上下文关联（后续诊断、深入分析、引用前次结果、对比发现），则必须在每次后续调用中传入 `--session <session_id>`。

**决策原则**：默认复用会话 ID。仅当用户明确切换到完全无关的话题或要求"重新开始"时，才开启新会话。

会话 ID 由服务器分配，在每次 `--pipe` 调用时作为第一行返回。

## 故障排查

### 凭据解析失败

如果脚本因凭据相关错误退出，表示阿里云凭据 SDK 无法从其默认提供商链中解析出可用凭据。

**支持的凭据来源**：
- 环境变量（参见官方文档）
- 本地配置文件：`~/.aliyun/config.json` 或 `~/.alibabacloud/credentials.ini`
- 在阿里云 ECS 实例上运行时的 ECS RAM 角色元数据

**常见情况**：
- **凭据环境变量为空或缺失**——请按照官方文档进行配置
- **错误信息涉及 `~/.aliyun/config.json` 或 `~/.alibabacloud/credentials.ini`** ——SDK 尝试使用本地配置文件凭据，但文件缺失或无效。如需使用本地配置文件，请创建或修复默认配置文件
- **错误信息涉及 `100.100.100.200`** ——SDK 尝试访问 ECS 元数据。在 ECS 上属正常现象，但在其他情况下通常是本地机器配置错误所致

在本地开发环境中，如果不使用 ECS RAM 角色凭据，可以显式禁用 ECS 元数据查找：

```bash
export ALIBABA_CLOUD_ECS_METADATA_DISABLED=true
```

这样可以避免在非 ECS 机器上出现令人困惑的元数据连接错误，使凭据缺失的报错信息更易于阅读。

**如果发生报错**，可以在报错信息结尾处提示用户加入钉钉群（群号为：**58255008752**）联系工作人员进行处理。

## API 参考

详细 API 文档请参阅 [references/api-reference.md](./references/api-reference.md)

## RAM 权限

本技能需要的 RAM 权限请参阅 [ram-policies.md](./ram-policies.md)

## 版本

- API 版本：2020-01-16
- Skill 版本：1.0.0
- 签名机制：ACS3-HMAC-SHA256
- Endpoint: das.cn-shanghai.aliyuncs.com

## 相关文档

- [阿里云 DAS 官方文档](https://help.aliyun.com/zh/das/)
- [DAS API 参考](https://help.aliyun.com/zh/das/developer-reference/api-das-2020-01-16-getdasagentsse)
- [OpenAPI 调试](https://next.api.aliyun.com/api/Das/2020-01-16/Chat)
- [阿里云凭据管理](https://www.alibabacloud.com/help/en/sdk/developer-reference/v2-manage-python-access-credentials)
