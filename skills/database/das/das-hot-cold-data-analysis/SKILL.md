---
name: das-hot-cold-data-analysis
description: 基于DAS企业版审计日志分析热数据和冷数据，提供Redis迁移建议和业务价值分析
---

# DAS 热冷数据分析技能

基于阿里云 DAS 企业版近30天审计日志，分析数据库中的热数据（高频读写）和冷数据（低频访问），并提供专业的 Redis 迁移建议和业务价值分析。

## 核心功能

### 🔥 热数据识别
- **分析维度**: 库、表、字段级别的访问频率统计
- **时间范围**: 近30天审计日志数据
- **识别标准**: 基于 SQL 执行频率、数据访问量、读写比例等指标
- **输出结果**: 热数据清单，包含访问频率、数据量、业务影响度

### ❄️ 冷数据识别  
- **分析维度**: 长期未访问或低频访问的数据
- **识别标准**: 超过指定时间阈值（如7天、15天、30天）未访问
- **输出结果**: 冷数据清单，包含最后访问时间、数据量、归档建议

### 🚀 Redis 迁移建议
- **引擎类型推荐**: 
  - **Tair 性能增强型**: 高并发、低延迟场景
  - **Tair 持久内存型**: 大容量、持久化需求场景  
  - **标准 Redis**: 通用缓存场景
- **规格评估**: 基于数据量、QPS、连接数等指标
- **地域选择**: 与源数据库同地域部署，降低网络延迟
- **成本对比**: 迁移前后成本分析

### 💼 业务价值分析
- **性能提升**: 预估 QPS 提升、响应时间降低
- **成本优化**: 存储成本节约、计算资源释放
- **业务连续性**: 缓存策略、回退方案设计
- **MetaAgent 集成**: 结合数据资产盘点结果，从业务角度说明价值

### ⚠️ 前置条件检查
- **审计日志状态**: 检查是否已开启 DAS 企业版审计日志
- **MetaAgent 状态**: 检查是否已完成数据资产盘点
- **开通建议**: 对未满足条件的用户提供开通指导

## 技术实现

### 数据源
1. **DAS 企业版审计日志 API**:
   - `DescribeSqlLogStatistic` - 获取审计日志统计信息
   - `GetDasSQLLogHotData` - 查询热存储数据明细
   - `CreateSqlLogTask` - 创建离线分析任务
   - `DescribeSqlLogTasks` - 查询分析任务列表

2. **DMS Enterprise MetaAgent API**:
   - `GetTableKnowledgeInfo` - 获取表知识信息（业务含义、数据敏感度等）
   - `EditMetaKnowledgeAsset` - 编辑元数据知识资产

3. **DAS Agent API**:
   - `GetDasAgentSSE` - 自然语言交互，获取诊断建议

### 分析流程
1. **前置检查**: 验证审计日志和 MetaAgent 开通状态
2. **数据采集**: 获取近30天审计日志统计数据
3. **热冷识别**: 基于访问频率和时间窗口进行数据分类
4. **业务关联**: 结合 MetaAgent 数据资产信息
5. **方案生成**: 生成详细的迁移建议和实施方案
6. **价值评估**: 从业务和技术角度评估收益

## 使用场景

### 场景1: 已开通审计日志和 MetaAgent
- 直接分析现有数据，提供完整的热冷数据分析报告
- 包含详细的 Redis 迁移方案和业务价值分析

### 场景2: 仅开通审计日志
- 分析热冷数据，但业务价值分析基于通用规则
- 建议开通 MetaAgent 以获得更精准的业务洞察

### 场景3: 未开通任何服务
- 提供开通指导和预期效果示例
- 展示开通后的分析能力预览

## 输出格式

### 热数据分析报告
```json
{
  "hot_tables": [
    {
      "database": "user_db",
      "table": "user_profile", 
      "fields": ["user_id", "nickname", "avatar_url"],
      "daily_access_count": 1500000,
      "read_write_ratio": "95:5",
      "data_size_mb": 256,
      "business_value": "高",
      "redis_recommendation": {
        "engine_type": "tair-performance-enhanced",
        "spec": "2g.master.rodb.2xlarge",
        "region": "cn-hangzhou",
        "estimated_qps_improvement": "10x",
        "cost_savings": "30%"
      }
    }
  ]
}
```

### 冷数据归档建议
```json
{
  "cold_tables": [
    {
      "database": "order_db", 
      "table": "order_history_2023",
      "last_access_time": "2026-02-15T10:30:00Z",
      "data_size_gb": 120,
      "archive_recommendation": {
        "strategy": "OSS归档",
        "estimated_cost_savings": "80%",
        "access_pattern": "按需查询"
      }
    }
  ]
}
```

## 权限要求

- **RAM 策略**: AliyunHDMFullAccess（DAS 企业版管理权限）
- **DMS 权限**: 数据资产盘点和元数据管理权限
- **实例权限**: 目标数据库实例的只读权限（用于审计日志分析）

## 实施建议

### 迁移时间窗口
- **最佳时间**: 业务低峰期（如凌晨2-4点）
- **分批迁移**: 按数据热度分批次迁移，降低风险
- **监控指标**: 迁移过程中的 QPS、延迟、错误率监控

### 回退方案
- **数据一致性**: 双写策略确保数据同步
- **快速回退**: 配置开关，支持秒级回退到原数据库
- **验证机制**: 迁移后数据校验和业务功能验证

## 示例演示

### 未开通服务的用户示例
> "您的 RDS MySQL 实例目前未开启 DAS 企业版审计日志。开通后，我们可以为您分析出类似以下的热数据：
> - **user_profile 表**: 日均访问 150 万次，适合迁移到 Tair 性能增强型，预计 QPS 提升 10 倍，成本降低 30%
> - **product_catalog 表**: 日均访问 80 万次，适合 Redis 缓存，响应时间从 50ms 降至 2ms"

### 已开通服务的用户示例  
> "基于您近30天的审计日志分析，我们识别出以下热数据：
> **高价值热数据**:
> - user_session 表: 日均 200 万次访问，读写比 80:20
> - product_inventory 表: 日均 120 万次访问，高并发更新
> 
> **Redis 迁移建议**:
> - 引擎类型: Tair 性能增强型 (持久化 + 高性能)
> - 规格: 4GB 主从架构  
> - 部署地域: cn-hangzhou (与 RDS 同地域)
> - 预期收益: QPS 从 5000 提升至 50000，P99 延迟从 20ms 降至 1ms"

## References

- [DAS 企业版 API 文档](https://help.aliyun.com/zh/das/developer-reference/api-das-2020-01-16-overview)
- [DMS Enterprise MetaAgent API](https://next.api.aliyun.com/api/dms-enterprise/2018-11-01/GetTableKnowledgeInfo)
- [Tair 产品文档](https://help.aliyun.com/product/61475.html)
- [DAS 审计日志配置指南](https://help.aliyun.com/document_detail/65405.html)