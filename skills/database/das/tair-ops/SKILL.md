---
name: tair-ops
description: 云数据库Tair（兼容redis）智能运维技能，支持CPU诊断、时延洞察、大Key分析等Redis专属功能
---

# 云数据库Tair-Ops 智能运维技能

使用阿里云数据库自治服务（DAS Agent）OpenAPI 管理 Tair/Redis 数据库智能运维，执行AI驱动的诊断、性能分析、安全风险检测等操作。

## 前置要求

- **AccessKey 要求**：使用 RAM 用户/角色最小权限的 AccessKey
- **环境变量**（推荐）：
  ```bash
  export ALIBABA_CLOUD_ACCESS_KEY_ID="your_ak"
  export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your_sk"
  ```
- **Region 默认值**：如未指定 Region，默认使用 `cn-hangzhou`
- **权限要求**：确保 RAM 用户具有 DAS 管理权限（AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess）
- **实例接入**：目标 Tair 实例必须已正常接入 DAS 服务
- **DAS Agent 开通**：需要单独开通 DAS Agent 服务并配置实例管理权限

## 支持的诊断功能

### Redis特性分析
- **CPU实时诊断**: `redis_cpu_diagnose_history_time` - 基于会话数据、大Key和热Key进行根因分析
- **时延洞察解读**: `redis_latency_log_summary` - 分析Proxy节点或数据节点的时延数据
- **Large Key查询分析**: `tair_history_large_key_query_and_analysis` - 基于历史大Key进行分析

### 监控和管理功能
- **重要性能指标总结**: `important_performance_metrics_summary`
- **待优化实例概览**: `query_the_instances_that_need_to_be_optimized`
- **实例信息查询**: `list_instances`
- **实例拓扑查询**: `instance_topology_query_tool`
- **实例配置查询**: `get_instance_config`

## 调用方式

### 方式一：使用 das-agent 脚本（推荐）
```bash
# 查询所有Tair实例
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "列出所有Tair实例"

# 分析特定Tair实例的时延问题
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "分析实例 r-t4nexample 的时延洞察"

# 大Key分析
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "分析实例 r-t4nexample 的大Key情况"
```

### 方式二：结构化调用
使用 operation_id 直接调用特定诊断技能：

```json
{
  "operation_id": "redis_cpu_diagnose_history_time",
  "input_parameters": {
    "instance_id": "r-t4nexample",
    "start_time": "2026-03-25T10:00:00+08:00",
    "end_time": "2026-03-25T11:00:00+08:00"
  },
  "direct_mode": true
}
```

### 方式三：自然语言查询
直接在 query 中输入自然语言问题：
- `"r-t4nexample实例最近的CPU使用率异常原因是什么？"`
- `"分析r-t4nexample实例的时延分布情况"`
- `"检查r-t4nexample实例是否存在大Key风险"`

## 参数说明

- **node_id**: 时延洞察和Large Key分析必须指定node_id参数
- **时间范围**: 时延洞察分析时间最长支持30分钟
- **实例ID**: Tair实例ID格式为 `r-xxxxxxxx`

## 技能文件结构

- **SKILL.md**: 本技能说明文档
- **agents/das_agent.yaml**: Tair专属诊断能力配置
- **scripts/**: 调用脚本和工具
- **references/sources.md**: 参考文档和注意事项

## 注意事项

1. **兼容性**: Tair兼容Redis协议，支持Redis相关的诊断功能
2. **架构特性**: Tair的Proxy+数据节点架构需要特别关注时延分布
3. **大Key风险**: Large Key是Redis/Tair的主要性能瓶颈之一
4. **V3签名**: 所有API调用使用阿里云V3签名机制 (ACS3-HMAC-SHA256)

## Output Policy

若需保存响应或生成文件，写入：
`output/tair-ops/`