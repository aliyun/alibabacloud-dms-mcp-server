# Tair-Ops 参考文档

## 官方文档
- [DAS Agent 用户指南](https://help.aliyun.com/zh/das/user-guide/das-agent)
- [云数据库Tair 产品文档](https://help.aliyun.com/product/61475.html)

## API 文档
- **产品代码**: das
- **API 版本**: 2020-01-16
- **核心接口**: GetDasAgentSSE
- **Endpoint**: das.cn-hangzhou.aliyuncs.com

## Tair（Redis）专属功能说明

### CPU诊断功能
- **CPU实时诊断**: 基于实时会话数据、大Key和热Key进行根因分析
- **重要性能指标总结**: 包含Tair实例的关键性能指标

### Redis特性分析
- **时延洞察解读**: 分析Proxy节点或数据节点的时延数据，识别高时延命令
- **Large Key查询分析**: 基于历史大Key数据进行分析，返回对应的热Key信息

### 监控和管理功能
- **待优化实例概览**: 识别需要关注的Tair实例
- **实例信息查询**: 按引擎类型过滤Tair实例
- **实例拓扑查询**: Tair实例的节点拓扑结构
- **实例配置查询**: Tair实例的详细配置信息

## 参数要求
- **node_id**: 时延洞察和Large Key分析必须指定node_id参数
- **时间范围**: 时延洞察分析时间最长支持30分钟

## 权限要求
- **RAM策略**: AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess
- **实例权限**: 需要对目标Tair实例有管理权限
- **DAS Agent**: 需要开通DAS Agent服务并配置实例管理权限

## 注意事项
1. **兼容性**: Tair兼容Redis协议，支持Redis相关的诊断功能
2. **架构特性**: Tair的Proxy+数据节点架构需要特别关注时延分布
3. **大Key风险**: Large Key是Redis/Tair的主要性能瓶颈之一