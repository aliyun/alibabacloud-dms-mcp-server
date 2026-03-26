# DAS Hot/Cold Data Analysis 参考文档

## 官方文档
- [DAS 企业版管理 API](https://help.aliyun.com/zh/das/developer-reference/api-das-2020-01-16-overview)
- [DMS Enterprise MetaAgent API](https://next.api.aliyun.com/api/dms-enterprise/2018-11-01/GetTableKnowledgeInfo)

## 核心 API 接口

### DAS 企业版审计日志分析
- **DescribeSqlLogConfig**: 查询DAS企业版配置信息
- **ModifySqlLogConfig**: 开启或配置DAS企业版  
- **DescribeSqlLogStatistic**: 查询DAS企业版数据统计信息
- **GetDasSQLLogHotData**: 查询DAS企业版热存储数据明细
- **CreateSqlLogTask**: 创建DAS企业版离线任务
- **DescribeSqlLogTask**: 查询DAS企业版离线任务详情

### DMS Enterprise MetaAgent
- **GetTableKnowledgeInfo**: 获取表知识信息（业务域、敏感度等）
- **EditMetaKnowledgeAsset**: 编辑元数据知识资产

## 分析维度

### 热数据识别标准
- **高频读写**: 日均访问次数 > 1000 次
- **低延迟要求**: 平均响应时间 < 50ms  
- **实时性要求**: 数据需要实时更新
- **业务关键性**: 属于核心业务表

### 冷数据识别标准  
- **低频访问**: 30天内访问次数 < 100 次
- **历史数据**: 超过业务活跃期的数据
- **归档价值**: 需要长期保存但很少访问
- **成本敏感**: 占用大量存储空间

## Redis 迁移建议

### 规格选择依据
- **QPS 预估**: 基于审计日志的读写频率
- **数据量大小**: 表数据体积决定内存需求  
- **持久化要求**: AOF vs RDB 选择
- **高可用需求**: 单机 vs 集群模式

### 迁移策略
- **双写模式**: 应用层同时写入数据库和Redis
- **缓存穿透防护**: 设置合理的过期时间和空值缓存
- **数据一致性**: 采用合适的缓存更新策略
- **回退方案**: 保留原数据库访问路径

## 成本优化建议

### 冷数据归档
- **OSS Standard-IA**: 适合偶尔访问的归档数据
- **生命周期管理**: 自动转换存储类型
- **加密保护**: SSE-KMS 加密敏感数据
- **备份策略**: 降低备份频率

### 监控指标
- **缓存命中率**: 目标 > 95%
- **存储成本节省**: 对比迁移前后成本
- **性能提升**: QPS 和响应时间改善
- **业务影响**: 用户体验和系统稳定性

## 权限要求
- **DAS 权限**: AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess
- **DMS 权限**: dms:ListMetaData, dms:GetTableKnowledgeInfo
- **Redis 权限**: AliyunKVStoreFullAccess (用于创建实例)
- **OSS 权限**: AliyunOSSFullAccess (用于归档操作)

## 典型应用场景

### 电商场景
- **热数据**: 用户会话、购物车、订单状态
- **冷数据**: 历史订单、用户行为日志、商品评价

### 金融场景  
- **热数据**: 账户余额、交易流水、风控规则
- **冷数据**: 历史交易记录、审计日志、合规数据

### 社交场景
- **热数据**: 用户关系、消息队列、在线状态
- **冷数据**: 历史聊天记录、用户画像、统计数据