---
name: self-hosted-postgresql-ops
description: Self-Hosted PostgreSQL智能运维技能，支持SQL优化、空间分析等基础PostgreSQL功能
---

# 自建/他云 PostgreSQL 智能运维技能

使用阿里云数据库自治服务（DAS Agent）OpenAPI 管理自建或其他云厂商的 PostgreSQL 实例，执行 SQL 优化、空间分析等基础诊断操作。

## 前置要求

- **AccessKey 要求**：使用 RAM 用户/角色最小权限的 AccessKey
- **环境变量**（推荐）：
  ```bash
  export ALIBABA_CLOUD_ACCESS_KEY_ID="your_ak"
  export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your_sk"
  ```
- **实例接入**：目标 PostgreSQL 实例必须已正常接入 DAS 服务
- **DAS Agent 开通**：需要单独开通 DAS Agent 服务并配置实例管理权限

## 支持的诊断功能

### SQL 优化类
- **SQL诊断优化** (`mysql_query_optimization_advisor`)：基于表结构、索引、执行计划的 SQL 优化建议
- **建表语句查看** (`show_create_table`)：查看指定表的建表语句（支持 schema 参数）

### 空间分析类  
- **空间分析** (`storage_analyze`)：库表空间概况分析和优化项识别

### 安全类
- **安全异常事件** (`security_describe_abnormal_events`)：异常登录、敏感数据下载等安全事件检测
- **最新安全基线** (`security_latest_baseline_analysis`)：安全配置状态检查
- **敏感数据发现** (`security_sensitive_scan_lookup`)：数据库中的敏感信息扫描

### 实例管理类
- **实例信息查询** (`list_instances`)：按引擎类型过滤 PostgreSQL 实例

## 调用方式

### Python API 调用
```python
from das_agent import call_das_agent_sse

# SQL 优化示例
query = "rm-xxxxxx实例，testdb数据库，SQL为SELECT * FROM orders，请诊断下SQL的问题，给出优化建议"
result = call_das_agent_sse(query, stream=False)
print(result["answer"])
```

### 命令行调用
```bash
# 使用自然语言查询
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "rm-xxxxxx实例的慢SQL有哪些"

# 列出所有 PostgreSQL 实例  
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py list-instances
```

## 技术细节

- **API 版本**: 2020-01-16
- **签名机制**: V3 签名 (ACS3-HMAC-SHA256)  
- **服务端点**: das.cn-hangzhou.aliyuncs.com
- **响应格式**: SSE (Server-Sent Events) 流式返回

## 注意事项

1. **功能限制**: 自建/他云 PostgreSQL 仅支持基础诊断功能，不支持 CPU 诊断、慢日志分析等高级功能
2. **标准协议**: 仅支持标准 PostgreSQL 协议，各厂商特有定制功能暂不兼容
3. **Schema 参数**: 建表语句查看需要指定正确的 schema 名称

## Output Policy

若需保存响应或生成文件，写入：
`output/self-hosted-postgresql-ops/`