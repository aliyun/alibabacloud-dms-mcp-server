---
name: polardb-postgresql-ops
description: PolarDB PostgreSQL版智能运维技能，支持SQL优化、空间分析等PolarDB PostgreSQL专属功能
---

# PolarDB PostgreSQL-Ops 智能运维技能

## 功能概述
PolarDB PostgreSQL版智能运维技能，专为 PolarDB PostgreSQL 兼容版实例设计，支持 SQL 优化、空间分析、监控指标查询等核心诊断功能。

## 支持的诊断能力

### SQL优化类
- **SQL诊断优化**: 基于表结构、索引、执行计划的SQL优化建议
- **慢日志分析（TP）**: 基于PostgreSQL慢日志的统计分析
- **查看建表语句**: 支持schema参数以适应PostgreSQL的命名空间特性

### 监控和分析类  
- **监控指标查询**: CPU、内存、存储空间等基础指标
- **重要性能指标总结**: 跨时间段的性能趋势分析
- **空间分析**: 库表空间使用情况分析
- **待优化实例概览**: 识别需要关注的PolarDB PostgreSQL实例

### 安全功能
- **安全异常事件**: 异常登录、敏感数据下载等安全事件检测
- **安全基线分析**: 最新安全配置状态检查
- **敏感数据发现**: 数据库中的敏感信息扫描
- **安全风险趋势**: 全局和实例级别的安全风险分析

### 实例管理功能
- **实例信息查询**: 按引擎类型过滤PolarDB PostgreSQL实例
- **实例拓扑查询**: PolarDB PostgreSQL实例的节点拓扑结构
- **实例配置查询**: PolarDB PostgreSQL实例的详细配置信息

## 不支持的功能
由于 PolarDB PostgreSQL 的架构特性，不支持以下功能：
- **HA查询分析**: PolarDB 使用共享存储架构，不支持传统的主备切换记录查询

## V3 签名调用方法

所有诊断功能都通过 DAS Agent 的 `GetDasAgentSSE` 接口调用，使用正确的 V3 签名机制：

```python
from das_agent import call_das_agent_sse

# 查询 PolarDB PostgreSQL 实例
result = call_das_agent_sse(
    query="请列出所有PolarDB PostgreSQL实例",
    stream=False
)
print(result["answer"])
```

## 参数要求
- **Search Path**: SQL优化分析可以补充Search_path参数以增强分析效果
- **Schema支持**: 建表语句查看需要指定schema参数
- **版本兼容**: 支持主流的PolarDB PostgreSQL版本

## 权限要求
- **RAM策略**: AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess
- **实例权限**: 需要对目标PolarDB PostgreSQL实例有管理权限  
- **DAS Agent**: 需要开通DAS Agent服务并配置实例管理权限

## 文件结构
- `agents/das_agent.yaml`: PolarDB PostgreSQL专属诊断能力配置
- `scripts/query_polardb_postgresql.py`: 查询脚本示例
- `references/sources.md`: 参考文档和注意事项