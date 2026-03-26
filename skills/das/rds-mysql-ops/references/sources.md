# RDS MySQL-Ops 参考文档

## 官方文档
- [DAS Agent 用户指南](https://help.aliyun.com/zh/das/user-guide/das-agent)
- [RDS MySQL 产品文档](https://help.aliyun.com/product/5422.html)

## API 文档
- **产品代码**: das
- **API 版本**: 2020-01-16
- **核心接口**: GetDasAgentSSE
- **Endpoint**: das.cn-hangzhou.aliyuncs.com

## RDS MySQL 专属功能说明

### HA分析功能
RDS MySQL 支持主备切换记录查询和分析，这是其他引擎（如PolarDB-X）不支持的功能。

### 自增ID溢出风险
专门针对MySQL的自增主键特性提供的风险检测功能。

### 元数据锁分析
针对MySQL特有的元数据锁机制进行的阻塞分析。

## 权限要求
- **RAM策略**: AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess
- **实例权限**: 需要对目标RDS MySQL实例有管理权限
- **DAS Agent**: 需要开通DAS Agent服务并配置实例管理权限

## 支持的RDS MySQL版本
- MySQL 5.6
- MySQL 5.7  
- MySQL 8.0

## 注意事项
1. **Performance Schema**: RDS MySQL 8.0 实例的事务阻塞分析需要开启 Performance Schema
2. **错误日志参数**: 需要开启 `innodb_deadlock_detect` 和 `innodb_print_all_deadlocks` 参数
3. **日志详细级别**: RDS MySQL实例需将 `log_error_verbosity` 设置为3以获取完整的错误日志