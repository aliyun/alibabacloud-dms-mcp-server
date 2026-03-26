# RDS SQL Server-Ops 参考文档

## 官方文档
- [DAS Agent 用户指南](https://help.aliyun.com/zh/das/user-guide/das-agent)
- [RDS SQL Server 产品文档](https://help.aliyun.com/product/5432.html)

## API 文档
- **产品代码**: das
- **API 版本**: 2020-01-16
- **核心接口**: GetDasAgentSSE
- **Endpoint**: das.cn-hangzhou.aliyuncs.com

## RDS SQL Server 支持的功能说明

### 慢日志分析
- **慢日志分析（TP）**: 基于SQL Server慢日志的统计分析，识别问题SQL语句
- **性能指标总结**: 包含SQL Server实例的关键性能指标

### 存储空间分析
- **SQLServer存储空间分析**: 专门针对SQL Server的存储空间使用情况进行分析
- **存储空间异常项**: 识别存储空间使用异常的情况

### 监控功能
- **重要性能指标总结**: 跨时间段的SQL Server性能趋势分析
- **待优化实例概览**: 识别需要关注的SQL Server实例

### 安全功能
- **安全异常事件**: 异常登录、敏感数据下载等安全事件检测
- **安全基线分析**: 最新安全配置状态检查
- **敏感数据发现**: 数据库中的敏感信息扫描
- **安全风险趋势**: 全局和实例级别的安全风险分析

### 实例管理
- **实例信息查询**: 按引擎类型过滤SQL Server实例
- **实例拓扑查询**: SQL Server实例的节点拓扑结构
- **实例配置查询**: SQL Server实例的详细配置信息

## 权限要求
- **RAM策略**: AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess
- **实例权限**: 需要对目标RDS SQL Server实例有管理权限
- **DAS Agent**: 需要开通DAS Agent服务并配置实例管理权限

## 注意事项
1. **SQL Server特性**: 功能针对SQL Server的特定架构和特性进行优化
2. **版本兼容**: 支持主流的SQL Server版本
3. **监控限制**: 某些高级诊断功能可能受限于SQL Server的监控能力