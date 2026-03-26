---
name: rds-sqlserver-ops
description: RDS SQL Server智能运维技能，支持慢日志分析、存储空间分析等SQL Server专属功能
---

# RDS SQL Server-Ops 智能运维技能

## 概述
RDS SQL Server智能运维技能专为阿里云RDS SQL Server实例设计，提供针对性的数据库诊断和优化能力。基于DAS Agent的V3签名机制，通过自然语言或结构化方式调用`GetDasAgentSSE`接口。

## 支持的诊断功能
- **慢日志分析（TP）**: 基于SQL Server慢日志统计数据，识别问题SQL并提供优化建议
- **SQLServer存储空间分析**: 查询SQL Server存储空间使用情况，分析存储空间异常项
- **重要性能指标总结**: 指定时间范围查询实例重要性能指标并给出总结
- **待优化实例概览**: 查询需重点关注的SQL Server实例列表
- **实例信息查询**: 查询当前账号下的SQL Server实例信息
- **实例拓扑查询**: 查询SQL Server实例拓扑信息和节点详情
- **实例配置查询**: 查询SQL Server实例配置及状态信息
- **安全相关功能**: 安全异常事件、安全基线分析、敏感数据发现、安全风险趋势等

## 引擎特性说明
- **不支持的功能**: SQL Server不支持CPU实时诊断、内存异常诊断、HA查询分析等MySQL特有功能
- **专属功能**: SQLServer存储空间分析是SQL Server特有的诊断功能
- **慢日志分析**: 基于SQL Server的慢查询日志进行分析

## 使用方法

### 环境配置
```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID="your_access_key_id"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your_access_key_secret"
```

### 自然语言查询示例
- "分析实例rm-xxxx的慢SQL"
- "查询rm-xxxx实例的存储空间使用情况"
- "列出所有RDS SQL Server实例"

### 结构化调用示例
```json
{
  "operation_id": "sql_slowlog_summary",
  "input_parameters": {
    "instance_id": "rm-xxxxxx",
    "start_time": "2026-03-24T00:00:00+08:00",
    "end_time": "2026-03-25T00:00:00+08:00",
    "top_n": "10"
  },
  "direct_mode": true
}
```

## 权限要求
- **RAM策略**: AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess
- **实例权限**: 需要对目标RDS SQL Server实例有管理权限
- **DAS Agent**: 需要开通DAS Agent服务并配置实例管理权限

## 注意事项
1. **版本兼容**: 支持主流的SQL Server版本
2. **功能限制**: SQL Server的功能集相对MySQL较少，主要集中在慢日志和存储空间分析
3. **参数要求**: 慢日志分析需要指定时间范围和记录数量