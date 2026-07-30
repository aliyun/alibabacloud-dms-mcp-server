# PolarDB MySQL-Ops 参考文档

## 官方文档
- [DAS Agent 用户指南](https://help.aliyun.com/zh/das/user-guide/das-agent)
- [PolarDB MySQL 产品文档](https://help.aliyun.com/product/58764.html)

## API 文档
- **产品代码**: das
- **API 版本**: 2020-01-16
- **核心接口**: GetDasAgentSSE
- **Endpoint**: das.cn-hangzhou.aliyuncs.com

## PolarDB MySQL 专属特性说明

### 节点ID要求
PolarDB MySQL版实例必须指定node_id参数，默认为主节点。

### 不支持的功能
- **HA查询分析**: PolarDB MySQL使用共享存储架构，不支持传统的主备切换记录查询
- 其他RDS MySQL特有的高可用相关功能

### 支持的功能
PolarDB MySQL支持大部分MySQL诊断功能，包括：
- CPU实时诊断和历史诊断
- SQL优化和慢日志分析
- 内存异常诊断
- 锁分析和死锁分析
- 空间分析和自增ID风险检测

## 权限要求
- **RAM策略**: AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess
- **实例权限**: 需要对目标PolarDB MySQL实例有管理权限
- **DAS Agent**: 需要开通DAS Agent服务并配置实例管理权限

## 支持的PolarDB MySQL版本
- MySQL 5.6 兼容版
- MySQL 5.7 兼容版  
- MySQL 8.0 兼容版

## 注意事项
1. **Performance Schema**: PolarDB MySQL 8.0 实例的事务阻塞分析需要开启 Performance Schema
2. **错误日志参数**: 需要开启 `innodb_deadlock_detect` 和 `innodb_print_all_deadlocks` 参数
3. **日志详细级别**: 需将 `log_error_verbosity` 设置为3以获取完整的错误日志