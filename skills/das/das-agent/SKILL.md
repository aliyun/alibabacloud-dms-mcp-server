---
name: das-agent
description: Invoke Alibaba Cloud DAS (Database Autonomy Service) Agent for database operations, diagnostics, and SQL analysis. Provides full-lifecycle management for Alibaba Cloud database products including RDS, PolarDB, MongoDB, Redis (Tair), and Lindorm. Execute database queries, performance analysis, slow SQL diagnostics, space analysis, parameter tuning, and anomaly detection using natural language. Also suitable for consulting Alibaba Cloud database product information and technical terminology. Use this skill when users mention database operations, Alibaba Cloud DAS, RDS, PolarDB, MongoDB, Redis, Tair, performance diagnostics, SQL optimization, slow query analysis, or database-related technical questions.
async: true
timeout: 1800
---

# DAS Agent

Interact with Alibaba Cloud DAS (Database Autonomy Service) Agent API to execute database operations using natural language.

## Prerequisites

The following environment variables must be configured before use:

```bash
# Alibaba Cloud AccessKey (requires AliyunHDMFullAccess permission)
export ALIBABA_CLOUD_ACCESS_KEY_ID="your_access_key_id"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your_access_key_secret"

# DAS Agent ID (obtain from DAS console)
export ALIBABA_CLOUD_DAS_AGENT_ID="your_agent_id"
```

Verify environment variables are configured:

```bash
echo $ALIBABA_CLOUD_ACCESS_KEY_ID
echo $ALIBABA_CLOUD_DAS_AGENT_ID
```

Ensure `uv` is installed:

```bash
which uv # Confirm uv is installed
```

## Usage

### Command Line Execution

```bash
# Navigate to the das-agent skill directory
cd das-agent

# Basic invocation - single turn conversation
uv run call_das_agent.py --question "Check instance rm-12345 status"

# Verbose output mode
uv run call_das_agent.py --question "View slow queries" -v

# Multi-turn conversation with session ID (must be UUID format)
# Generate UUID first
uuidgen # Suppose it returns fake-uuid
# Invoke with session ID
uv run call_das_agent.py --question "View slow queries" --session "fake-uuid"
# Follow-up question
uv run call_das_agent.py --question "Analyze the cause of slow query xxx in detail" --session "fake-uuid"
```

### Response Handling

DAS Agent returns SSE streaming responses. Parse the `Delta` field from `TEXT_MESSAGE_CONTENT` events to extract actual text content.

## Common Use Cases

| Scenario | Example Query |
|----------|---------------|
| Instance Status Query | "Check CPU and memory usage for instance rm-12345" |
| Performance Analysis | "Analyze database performance over the past 1 hour" |
| Slow SQL Diagnostics | "View slow queries from the last 24 hours" |
| SQL Optimization Recommendations | "Help me optimize this SQL..." |
| Space Analysis | "View database instance space usage" |
| Health Check | "Perform comprehensive health check on instance" |

## Error Handling

### Error -1810006: Agent Not Associated with Instance

If you encounter this error:

```
[错误 -1810006] the das agent or default is not associated with any instance
```

It means the DAS Agent has not been associated with any database instance. To resolve:

1. Open Alibaba Cloud DAS Console: https://das.console.aliyun.com/?aes_debug=#/das-agent?currentView=settings
2. Find your DAS Agent
3. Associate it with at least one database instance (RDS, PolarDB, etc.)

After enrollment, the Agent will be able to respond to queries.

## Important Notes

1. **Long-Running Tasks**: DAS Agent can perform long-running operations like multi-instance inspections, comprehensive diagnostics, or batch SQL analysis. These tasks may take up to **30 minutes**. Inform the user before starting:

   > "正在执行数据库巡检，这是一个长程任务，可能需要几分钟到半小时。我会持续监控进度并在完成后通知你。"

2. **Progress Updates**: DAS Agent streams progress during execution. You can check intermediate results and update the user periodically. Use phrases like:

   > "正在分析实例 X 的慢 SQL..."
   > "已完成 3/5 个实例的检查..."

3. **Agent Enrollment**: Ensure the target database instance is enrolled under the DAS Agent.

4. **Permissions**: AccessKey requires AliyunHDMFullAccess permission.

5. **Timeout**: Default timeout is 5 minutes; complex queries may require longer wait times.

6. **Pricing**: DAS Agent is free during public beta; charges may apply after general availability.

## Documentation

- Invocation Script: [call_das_agent.py](call_das_agent.py)
- Dependencies: [pyproject.toml](pyproject.toml)
- API Signature Algorithm: [reference.md](reference.md)
