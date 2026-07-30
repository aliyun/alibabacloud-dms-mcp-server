# RDS PostgreSQL-Ops 参考文档

## 官方文档
- [DAS Agent 用户指南](https://help.aliyun.com/zh/das/user-guide/das-agent)
- [RDS PostgreSQL 产品文档](https://help.aliyun.com/product/5432.html)

## API 文档
- **产品代码**: das
- **API 版本**: 2020-01-16
- **核心接口**: GetDasAgentSSE
- **Endpoint**: das.cn-hangzhou.aliyuncs.com

## RDS PostgreSQL 支持的功能说明

### SQL优化功能
- **SQL诊断优化**: 支持PostgreSQL的SQL语句分析和优化建议
- **慢日志分析（TP）**: 基于PostgreSQL慢日志的统计分析
- **建表语句查看**: 支持schema参数以适应PostgreSQL的命名空间特性

### 监控和分析功能
- **监控指标查询**: CPU、内存、存储空间等基础指标
- **重要性能指标总结**: 跨时间段的性能趋势分析
- **空间分析**: 库表空间使用情况分析
- **待优化实例概览**: 识别需要关注的PostgreSQL实例

### 安全功能
- **安全异常事件**: 异常登录、敏感数据下载等安全事件检测
- **安全基线分析**: 最新安全配置状态检查
- **敏感数据发现**: 数据库中的敏感信息扫描
- **安全风险趋势**: 全局和实例级别的安全风险分析

### 实例管理功能
- **实例信息查询**: 按引擎类型过滤PostgreSQL实例
- **实例拓扑查询**: PostgreSQL实例的节点拓扑结构
- **实例配置查询**: PostgreSQL实例的详细配置信息

## 权限要求
- **RAM策略**: AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess
- **实例权限**: 需要对目标RDS PostgreSQL实例有管理权限
- **DAS Agent**: 需要开通DAS Agent服务并配置实例管理权限

## 注意事项
1. **Search Path**: PostgreSQL的SQL优化分析可以补充Search_path参数以增强分析效果
2. **Schema支持**: 建表语句查看需要指定schema参数
3. **版本兼容**: 支持主流的PostgreSQL版本