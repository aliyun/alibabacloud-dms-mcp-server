---
name: rds-postgresql-ops
description: RDS PostgreSQL智能运维技能，支持SQL优化、空间分析等PostgreSQL专属功能
---

# RDS PostgreSQL-Ops 智能运维技能

使用阿里云数据库自治服务（DAS Agent）为 RDS PostgreSQL 实例提供智能运维能力，支持 SQL 优化、空间分析、安全检测等 PostgreSQL 专属功能。

## 前置要求

- **AccessKey 配置**: 设置 `ALIBABA_CLOUD_ACCESS_KEY_ID` 和 `ALIBABA_CLOUD_ACCESS_KEY_SECRET` 环境变量
- **DAS Agent 开通**: 需要单独开通 DAS Agent 服务并配置实例管理权限
- **实例接入**: 目标 RDS PostgreSQL 实例必须已正常接入 DAS 服务
- **权限要求**: RAM 用户需具有 DAS 管理权限（AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess）

## 支持的诊断功能

### SQL 优化类
- **SQL诊断优化**: 基于表结构、索引、执行计划的 SQL 优化建议
- **慢日志分析（TP）**: 基于 PostgreSQL 慢日志的统计分析
- **建表语句查看**: 支持 schema 参数以适应 PostgreSQL 的命名空间特性

### 监控和分析类  
- **监控指标查询**: CPU、内存、存储空间等基础指标
- **重要性能指标总结**: 跨时间段的性能趋势分析
- **空间分析**: 库表空间使用情况分析
- **待优化实例概览**: 识别需要关注的 PostgreSQL 实例

### 安全功能
- **安全异常事件**: 异常登录、敏感数据下载等安全事件检测
- **安全基线分析**: 最新安全配置状态检查
- **敏感数据发现**: 数据库中的敏感信息扫描
- **安全风险趋势**: 全局和实例级别的安全风险分析

### 实例管理功能
- **实例信息查询**: 按引擎类型过滤 PostgreSQL 实例
- **实例拓扑查询**: PostgreSQL 实例的节点拓扑结构
- **实例配置查询**: PostgreSQL 实例的详细配置信息

## 调用方式

### 环境变量配置（推荐）
```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID="your_access_key_id"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your_access_key_secret"
```

### 命令行调用
```bash
# 查询所有 RDS PostgreSQL 实例
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "列出所有RDS PostgreSQL实例"

# 分析特定实例的慢SQL
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "分析实例pgm-xxxxxx的慢SQL"

# SQL优化建议
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "为实例pgm-xxxxxx的数据库testdb中的SQL 'SELECT * FROM users WHERE email = ?' 提供优化建议"
```

### Python API 调用
```python
from das_agent import call_das_agent_sse

# 查询 PostgreSQL 实例
result = call_das_agent_sse("列出所有RDS PostgreSQL实例", stream=False)
print(result["answer"])
```

## 技术细节

- **API 版本**: 2020-01-16
- **签名机制**: V3 签名 (ACS3-HMAC-SHA256)
- **服务端点**: das.cn-hangzhou.aliyuncs.com
- **响应格式**: SSE (Server-Sent Events) 流式返回

## 注意事项

1. **Search Path**: PostgreSQL 的 SQL 优化分析可以补充 Search_path 参数以增强分析效果
2. **Schema 支持**: 建表语句查看需要指定正确的 schema 名称
3. **版本兼容**: 支持主流的 PostgreSQL 版本
4. **参数要求**: 某些功能可能需要开启特定的 PostgreSQL 参数

## Output Policy

若需保存响应或生成文件，写入：
`output/rds-postgresql-ops/`