---
name: polardb-mysql-ops
description: PolarDB MySQL版智能运维技能，支持CPU诊断、SQL优化等PolarDB MySQL专属功能，不包含HA分析（PolarDB-X架构不同）
---

# PolarDB MySQL版智能运维技能

使用阿里云数据库自治服务（DAS Agent）OpenAPI 管理 PolarDB MySQL版 实例的智能运维，执行AI驱动的诊断、性能分析、安全风险检测和智能运维报告等操作。

## 前置要求

- **AccessKey 要求**：使用 RAM 用户/角色最小权限的 AccessKey
- **环境变量**（推荐）：
  ```bash
  export ALIBABA_CLOUD_ACCESS_KEY_ID="your_ak"
  export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your_sk"
  ```
- **Region 默认值**：如未指定 Region，默认使用 `cn-hangzhou`
- **权限要求**：确保 RAM 用户具有 DAS 管理权限（AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess）
- **实例接入**：目标 PolarDB MySQL版 实例必须已正常接入 DAS 服务
- **DAS Agent 开通**：需要单独开通 DAS Agent 服务并配置实例管理权限

## 工作流

1) **确认前提条件**：验证 DAS Agent 是否已开通，目标实例是否已接入 DAS 并被 Agent 管理
2) **选择调用方式**：
   - **结构化调用**：使用 operation_id 精确触发特定诊断技能
   - **自然语言调用**：直接在 query 中输入自然语言问题
3) **准备参数**：收集必要的诊断参数或构造自然语言问题
4) **调用 API**：使用 GetDasAgentSSE 接口发起诊断请求（V3签名）
5) **处理响应**：解析诊断结果，提供优化建议和根因分析

## V3 签名调用方法

使用通用的 das-agent 客户端进行调用：

```bash
# 列出所有 PolarDB MySQL 实例
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "列出所有PolarDB MySQL版实例"

# 分析特定实例的慢SQL
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "分析实例pc-xxxxx的慢SQL"

# CPU使用率诊断
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "诊断实例pc-xxxxx最近24小时的CPU使用率异常"
```

## 支持的诊断功能

### 性能诊断类
- **CPU实时诊断**：`high_cpu_usage_real_time_diagnose_mysql`
- **CPU使用率诊断**：`performance_diagnose_mysql`  
- **内存异常诊断**：`memory_usage_anomaly_diagnosis`
- **异常会话识别**：`real_time_abnormal_session_identification`
- **锁分析**：`lock_analysis`
- **死锁分析**：`latest_deadlock_analysis`
- **错误日志分析**：`error_log_query_and_analysis`

### SQL优化类
- **SQL诊断优化**：`mysql_query_optimization_advisor`
- **慢日志分析（TP）**：`sql_slowlog_summary`

### 存储与空间类
- **空间分析**：`storage_analyze`
- **自增ID溢出风险**：`auto_increment_usage_analyze`

### 监控与安全类
- **监控指标查询**：`monitoring_indicator_query_tool`
- **重要性能指标总结**：`important_performance_metrics_summary`
- **安全异常事件**：`security_describe_abnormal_events`
- **安全基线分析**：`security_latest_baseline_analysis`
- **敏感数据发现**：`security_sensitive_scan_lookup`

## 不支持的功能

由于 PolarDB MySQL版 的架构特性，**不支持 HA 查询分析**（`HA_records_query_and_diagnosis`），这是 RDS MySQL 特有的功能。

## 技术细节

- **API版本**: 2020-01-16
- **签名机制**: V3签名 (ACS3-HMAC-SHA256)
- **服务端点**: das.cn-hangzhou.aliyuncs.com
- **响应格式**: SSE (Server-Sent Events) 流式返回

## 文件结构

- `SKILL.md`: 技能说明文档
- `agents/das_agent.yaml`: PolarDB MySQL版支持的诊断能力配置
- `scripts/`: 调用脚本和工具
- `references/sources.md`: 参考文档和注意事项

## 使用示例

```python
from das_agent import call_das_agent_sse

# 查询 PolarDB MySQL 实例列表
result = call_das_agent_sse(query="列出所有PolarDB MySQL版实例", stream=False)
print(result["answer"])
```