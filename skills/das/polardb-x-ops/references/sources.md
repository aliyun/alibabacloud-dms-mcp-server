# PolarDB-X-Ops 参考文档

## 官方文档
- [DAS Agent 用户指南](https://help.aliyun.com/zh/das/user-guide/das-agent)
- [PolarDB-X 产品文档](https://help.aliyun.com/product/14328.html)

## API 文档
- **产品代码**: das
- **API 版本**: 2020-01-16
- **核心接口**: GetDasAgentSSE
- **Endpoint**: das.cn-hangzhou.aliyuncs.com

## PolarDB-X 分布式数据库特性说明

### 支持的功能
作为分布式数据库，PolarDB-X支持以下诊断功能：
- **慢日志分析（TP）**: 分析分布式SQL执行的性能问题
- **空间分析**: 查询分布式表空间使用情况
- **重要性能指标总结**: 跨节点的性能指标汇总
- **安全相关功能**: 安全异常事件、基线分析、敏感数据发现等
- **实例管理功能**: 实例信息查询、拓扑查询、配置查询

### 不支持的功能
由于架构差异，PolarDB-X不支持以下单机MySQL功能：
- CPU实时诊断和历史诊断
- SQL诊断优化（mysql_query_optimization_advisor）
- HA查询分析
- 内存异常诊断
- 锁分析和死锁分析
- 异常会话识别
- 自增ID溢出风险
- 错误日志分析
- 监控指标查询（单节点级别）

## 权限要求
- **RAM策略**: AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess
- **实例权限**: 需要对目标PolarDB-X实例有管理权限
- **DAS Agent**: 需要开通DAS Agent服务并配置实例管理权限

## 注意事项
1. **分布式特性**: PolarDB-X的诊断需要考虑分布式架构的特点
2. **节点概念**: 虽然支持node_id参数，但主要用于标识计算节点或存储节点
3. **SQL兼容性**: 慢日志分析基于MySQL协议，但需要考虑分布式执行计划