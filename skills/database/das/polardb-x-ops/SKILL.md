---
name: polardb-x-ops
description: PolarDB-X智能运维技能，支持SQL优化、空间分析等PolarDB-X专属功能
---

Category: database

# PolarDB-X 智能运维技能

使用阿里云数据库自治服务（DAS Agent）为 PolarDB-X 分布式数据库提供智能运维能力，支持慢日志分析、空间分析、安全检测等功能。

## 前置要求

- **AccessKey 要求**: 使用 RAM 用户/角色最小权限的 AccessKey
- **环境变量**（推荐）:
  ```bash
  export ALIBABA_CLOUD_ACCESS_KEY_ID="your_access_key_id"
  export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your_access_key_secret"
  ```
- **Region 默认值**: 如未指定 Region，默认使用 `cn-hangzhou`
- **权限要求**: 确保 RAM 用户具有 DAS 管理权限（AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess）
- **实例接入**: PolarDB-X 实例必须已正常接入 DAS 服务
- **DAS Agent 开通**: 需要单独开通 DAS Agent 服务并配置实例管理权限

## 支持的诊断功能

### SQL 分析类
- **慢日志分析（TP）**: 分析分布式 SQL 执行的性能问题
- **空间分析**: 查询分布式表空间使用情况

### 监控类  
- **重要性能指标总结**: 跨节点的性能指标汇总
- **待优化实例概览**: 识别需要关注的 PolarDB-X 实例

### 安全类
- **安全异常事件**: 异常登录、敏感数据下载等安全事件检测
- **安全基线分析**: 最新安全配置状态检查
- **敏感数据发现**: 数据库中的敏感信息扫描
- **安全风险趋势**: 全局和实例级别的安全风险分析

### 实例管理类
- **实例信息查询**: 按引擎类型过滤 PolarDB-X 实例
- **实例拓扑查询**: PolarDB-X 实例的节点拓扑结构
- **实例配置查询**: PolarDB-X 实例的详细配置信息

## 调用方式

### 方式一：使用 das-agent 脚本（推荐）
```bash
# 列出所有 PolarDB-X 实例
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "列出所有PolarDB-X实例"

# 分析特定实例的慢SQL
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "分析实例px-xxxxxx的慢SQL"
```

### 方式二：Python API 调用
```python
from das_agent import call_das_agent_sse

# 查询 PolarDB-X 实例
result = call_das_agent_sse(
    query="列出所有PolarDB-X实例",
    stream=False
)
print(result["answer"])
```

## V3 签名技术细节

- **API 版本**: 2020-01-16
- **签名机制**: V3 签名 (ACS3-HMAC-SHA256)
- **服务端点**: das.cn-hangzhou.aliyuncs.com
- **响应格式**: SSE (Server-Sent Events) 流式返回

## 注意事项

1. **分布式特性**: PolarDB-X 的诊断需要考虑分布式架构的特点
2. **不支持的功能**: 由于架构差异，不支持 CPU 实时诊断、SQL 优化、HA 分析等单机 MySQL 功能
3. **节点概念**: 虽然支持 node_id 参数，但主要用于标识计算节点或存储节点

## Output Policy

若需保存响应或生成文件，写入：
`output/polardb-x-ops/`