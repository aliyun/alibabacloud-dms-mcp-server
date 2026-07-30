# MongoDB-Ops 参考文档

## 官方文档
- [DAS Agent 用户指南](https://help.aliyun.com/zh/das/user-guide/das-agent)
- [云数据库MongoDB 产品文档](https://help.aliyun.com/product/56482.html)

## API 文档
- **产品代码**: das
- **API 版本**: 2020-01-16
- **核心接口**: GetDasAgentSSE
- **Endpoint**: das.cn-hangzhou.aliyuncs.com

## MongoDB 专属功能说明

### 慢日志分析
- **慢日志分析（MongoDB）**: 基于MongoDB慢日志统计数据，识别问题Query模板
- **QueryId推荐**: 推荐需重点关注的QueryId列表，提供处理建议

### 空间分析
- **空间分析**: 查询MongoDB实例库表信息，展示空间概况和优化项

### 监控功能
- **重要性能指标总结**: 包含MongoDB实例的关键性能指标
- **待优化实例概览**: 识别需要关注的MongoDB实例

### 实例管理
- **实例信息查询**: 按引擎类型过滤MongoDB实例
- **实例拓扑查询**: MongoDB实例的节点拓扑结构  
- **实例配置查询**: MongoDB实例的详细配置信息

## 参数说明
- **node_id**: 非必选参数，用于指定特定节点
- **top_n**: 指定返回前N条慢日志记录
- **时间范围**: 慢日志分析需要指定start_time和end_time

## 权限要求
- **RAM策略**: AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess
- **实例权限**: 需要对目标MongoDB实例有管理权限
- **DAS Agent**: 需要开通DAS Agent服务并配置实例管理权限

## 注意事项
1. **Query模板**: MongoDB的慢日志分析基于Query模板而非SQL语句
2. **索引优化**: 慢Query通常与索引缺失或不当使用有关
3. **版本兼容**: 支持主流的MongoDB版本