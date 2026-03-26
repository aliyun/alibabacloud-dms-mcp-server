---
name: rds-mysql-ops
description: RDS MySQL智能运维技能，支持CPU诊断、SQL优化、HA分析等RDS MySQL专属功能，使用V3签名机制调用DAS Agent API。
---

# RDS MySQL-Ops 智能运维技能

使用阿里云数据库自治服务（DAS Agent）OpenAPI 管理 RDS MySQL 智能数据库运维，执行AI驱动的诊断、性能分析、安全风险检测和智能运维报告等操作。

## 前置要求

- **AccessKey 要求**：使用 RAM 用户/角色最小权限的 AccessKey
- **环境变量**（推荐）：
  ```bash
  export ALIBABA_CLOUD_ACCESS_KEY_ID="your_ak"
  export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your_sk"
  ```
- **Region 默认值**：如未指定 Region，默认使用 `cn-hangzhou`
- **权限要求**：确保 RAM 用户具有 DAS 管理权限（AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess）
- **实例接入**：目标 RDS MySQL 实例必须已正常接入 DAS 服务
- **DAS Agent 开通**：需要单独开通 DAS Agent 服务并配置实例管理权限

## 使用方法

### 命令行使用
```bash
# 查询所有RDS MySQL实例
python /home/admin/.openclaw/workspace/skills/rds-mysql-ops/scripts/query_instances.py

# 分析特定实例的慢SQL
python /home/admin/.openclaw/workspace/skills/rds-mysql-ops/scripts/analyze_slow_sql.py --instance-id "rm-xxxxxx"

# 自定义查询（自然语言）
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "请分析实例rm-xxxx的CPU使用率异常原因"
```

### Python API 使用
```python
from das_agent import call_das_agent_sse

# 查询RDS MySQL实例
result = call_das_agent_sse(
    query="请列出所有RDS MySQL实例",
    stream=False
)
print(result["answer"])
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
- **慢日志分析**：`sql_slowlog_summary`

### HA分析类（RDS MySQL专属）
- **HA查询分析**：`HA_records_query_and_diagnosis`

### 存储分析类
- **空间分析**：`storage_analyze`
- **自增ID溢出风险**：`auto_increment_usage_analyze`

### 监控类
- **监控指标查询**：`monitoring_indicator_query_tool`
- **重要性能指标总结**：`important_performance_metrics_summary`
- **待优化实例概览**：`query_the_instances_that_need_to_be_optimized`

### 安全类
- **安全异常事件**：`security_describe_abnormal_events`
- **安全基线变化**：`security_baseline_change_analysis`
- **最新安全基线**：`security_latest_baseline_analysis`
- **敏感数据发现**：`security_sensitive_scan_lookup`
- **安全风险趋势**：`describe_global_security_risk_histogram`, `describe_security_risk_histogram`
- **安全告警统计**：`describe_sql_security_alert_stats`

### 实例管理类
- **实例信息查询**：`list_instances`
- **实例拓扑查询**：`instance_topology_query_tool`
- **实例配置查询**：`get_instance_config`
- **查看建表语句**：`show_create_table`

## 技术细节

- **API版本**: 2020-01-16
- **签名机制**: V3签名 (ACS3-HMAC-SHA256)
- **服务端点**: das.cn-hangzhou.aliyuncs.com
- **响应格式**: SSE (Server-Sent Events) 流式返回

## 调用方式说明

### 方式一：结构化技能调用
使用 operation_id 直接调用特定诊断技能：
```json
{
  "operation_id": "mysql_query_optimization_advisor",
  "input_parameters": {
    "instance_id": "rm-xxxxxx",
    "database": "testdb", 
    "sql": "SELECT * FROM orders WHERE user_id = 123"
  },
  "direct_mode": true
}
```

### 方式二：自然语言查询（推荐）
直接在 query 参数中输入自然语言问题：
- `"rm-xxxxxx实例，昨天上午的CPU使用率情况如何，有异常的话是什么原因"`
- `"rm-xxxxxx实例，testdb数据库，SQL为SELECT * FROM orders WHERE user_id = 123，请诊断下SQL的问题，给出优化建议"`

## 注意事项

1. **HA分析功能**：RDS MySQL 支持主备切换记录查询和分析，这是其他引擎（如PolarDB-X）不支持的功能
2. **Performance Schema**：RDS MySQL 8.0 实例的事务阻塞分析需要开启 Performance Schema
3. **错误日志参数**：需要开启 `innodb_deadlock_detect` 和 `innodb_print_all_deadlocks` 参数
4. **日志详细级别**：RDS MySQL实例需将 `log_error_verbosity` 设置为3以获取完整的错误日志

## Output Policy

若需保存响应或生成文件，写入：
`output/rds-mysql-ops/`