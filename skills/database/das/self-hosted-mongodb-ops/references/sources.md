# Self-Hosted MongoDB-Ops 参考文档

## 官方文档
- [DAS Agent 用户指南](https://help.aliyun.com/zh/das/user-guide/das-agent)

## API 文档
- **产品代码**: das
- **API 版本**: 2020-01-16
- **核心接口**: GetDasAgentSSE
- **Endpoint**: das.cn-hangzhou.aliyuncs.com

## 自建/他云MongoDB支持范围说明

### 支持的功能
自建或其他云厂商的MongoDB实例，基于标准MongoDB协议，支持以下基础功能：
- **空间分析**: 库表空间概况分析
- **安全相关功能**: 安全异常事件、基线分析、敏感数据发现
- **实例管理**: 实例信息查询

### 不支持的功能
由于数据采集限制，自建/他云MongoDB不支持以下功能：
- 慢日志分析（MongoDB）
- 监控指标查询
- 重要性能指标总结
- 实例拓扑查询
- 实例配置查询
- 安全基线变化分析
- 全局/实例安全风险趋势
- 实例安全告警统计

## 权限要求
- **RAM策略**: AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess
- **实例权限**: 需要对目标自建MongoDB实例有管理权限
- **DAS Agent**: 需要开通DAS Agent服务并配置实例管理权限

## 注意事项
1. **标准协议**: 仅支持标准MongoDB协议，各厂商特有定制功能暂不兼容
2. **功能限制**: 功能受限主要是因为无法获取完整的性能监控数据和日志
3. **Query模板**: MongoDB的慢日志分析基于Query模板，但自建实例不支持此功能