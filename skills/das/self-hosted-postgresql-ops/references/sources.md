# Self-Hosted PostgreSQL-Ops 参考文档

## 官方文档
- [DAS Agent 用户指南](https://help.aliyun.com/zh/das/user-guide/das-agent)

## API 文档
- **产品代码**: das
- **API 版本**: 2020-01-16
- **核心接口**: GetDasAgentSSE
- **Endpoint**: das.cn-hangzhou.aliyuncs.com

## 自建/他云PostgreSQL支持范围说明

### 支持的功能
自建或其他云厂商的PostgreSQL实例，基于标准PostgreSQL协议，支持以下基础功能：
- **SQL诊断优化**: 基于表结构、索引、执行计划的SQL优化建议
- **空间分析**: 库表空间概况分析
- **安全相关功能**: 安全异常事件、基线分析、敏感数据发现
- **实例管理**: 实例信息查询、建表语句查看（支持schema参数）

### 不支持的功能
由于数据采集限制，自建/他云PostgreSQL不支持以下功能：
- CPU实时诊断和历史诊断
- 慢日志分析（TP）
- 内存异常诊断
- HA查询分析
- 监控指标查询
- 重要性能指标总结
- 实例拓扑查询
- 实例配置查询
- 安全基线变化分析
- 全局/实例安全风险趋势
- 实例安全告警统计

## 权限要求
- **RAM策略**: AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess
- **实例权限**: 需要对目标自建PostgreSQL实例有管理权限
- **DAS Agent**: 需要开通DAS Agent服务并配置实例管理权限

## 注意事项
1. **标准协议**: 仅支持标准PostgreSQL协议，各厂商特有定制功能暂不兼容
2. **Schema参数**: 建表语句查看需要指定正确的schema名称
3. **功能限制**: 功能受限主要是因为无法获取完整的性能监控数据和日志