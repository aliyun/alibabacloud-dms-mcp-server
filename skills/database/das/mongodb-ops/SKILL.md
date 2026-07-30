---
name: mongodb-ops
description: 云数据库MongoDB智能运维技能，支持慢日志分析、空间分析等MongoDB专属功能
---

# 云数据库 MongoDB 智能运维技能

使用阿里云数据库自治服务（DAS Agent）OpenAPI 管理 MongoDB 数据库运维，执行 AI 驱动的诊断、性能分析和智能运维报告等操作。

## 前置要求

- **AccessKey 要求**：使用 RAM 用户/角色最小权限的 AccessKey
- **环境变量**（推荐）：
  ```bash
  export ALIBABA_CLOUD_ACCESS_KEY_ID="your_ak"
  export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your_sk"
  ```
- **Region 默认值**：如未指定 Region，默认使用 `cn-hangzhou`
- **权限要求**：确保 RAM 用户具有 DAS 管理权限（AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess）
- **实例接入**：目标 MongoDB 实例必须已正常接入 DAS 服务
- **DAS Agent 开通**：需要单独开通 DAS Agent 服务并配置实例管理权限

## 支持的 MongoDB 引擎

### 云上数据库实例
- **云数据库 MongoDB**

### 自建/他云实例
- **MongoDB**：支持标准协议的自建或其他云厂商 MongoDB 实例
- **注意**：各厂商特有定制功能暂不兼容

## 调用方式说明

### 方式一：使用 das-agent 脚本（推荐）
```bash
# 查询所有 MongoDB 实例
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "列出所有云数据库MongoDB实例"

# 分析 MongoDB 慢日志
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "分析实例dds-xxxxxx的MongoDB慢日志"

# MongoDB 空间分析
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "分析实例dds-xxxxxx的MongoDB存储空间使用情况"
```

### 方式二：Python API 调用
```python
from das_agent import call_das_agent_sse

# 查询 MongoDB 实例
result = call_das_agent_sse(
    query="列出所有云数据库MongoDB实例",
    stream=False
)
print(result["answer"])
```

## 支持的诊断功能

### 慢日志分析
- **慢日志分析（MongoDB）**: 基于 MongoDB 慢日志统计数据，识别问题 Query 模板
- **QueryId 推荐**: 推荐需重点关注的 QueryId 列表，提供处理建议

### 空间分析
- **空间分析**: 查询 MongoDB 实例库表信息，展示空间概况和优化项

### 监控功能
- **重要性能指标总结**: 包含 MongoDB 实例的关键性能指标
- **待优化实例概览**: 识别需要关注的 MongoDB 实例

### 实例管理
- **实例信息查询**: 按引擎类型过滤 MongoDB 实例
- **实例拓扑查询**: MongoDB 实例的节点拓扑结构  
- **实例配置查询**: MongoDB 实例的详细配置信息

## 技术细节

- **API 版本**: 2020-01-16
- **签名机制**: V3 签名 (ACS3-HMAC-SHA256)
- **服务端点**: das.cn-hangzhou.aliyuncs.com
- **响应格式**: SSE (Server-Sent Events) 流式返回

## 选择问题（不确定时提问）

1. **DAS Agent 需要单独开通并配置实例管理权限，请问是否已开通？**
2. **目标 MongoDB 实例所在地域是什么？**（默认 cn-hangzhou）
3. **偏好使用脚本调用还是 Python API 调用？**

## Output Policy

若需保存响应或生成文件，写入：
`output/mongodb-ops/`

## References

- API Sources and Operations: `references/sources.md`
- Capability Listing Script: `scripts/list_capabilities.py`
- DAS Agent Client: `/home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py`