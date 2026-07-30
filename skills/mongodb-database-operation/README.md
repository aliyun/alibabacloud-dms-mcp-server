# MongoDB 数据库操作 Skill

阿里云 MongoDB (DDS) 数据库管理技能，使用 **V1 签名机制 (HMAC-SHA1)**，提供 10 大功能模块共计 45+ 个 API。

## 📋 功能概览

| 模块 | API 数量 | 核心功能 |
|------|---------|---------|
| 创建或克隆 | 2+ | 创建/克隆实例 |
| 变更配置 | 5+ | 规格/名称/密码修改 |
| 实例管理 | 5+ | 删除/重启/锁定 |
| 查询实例 | 5+ | 列表/详情/地域/资源 |
| 连接管理 | 4+ | 连接地址管理 |
| 资源管理 | 3+ | 标签管理 |
| 账号管理 | 6+ | 账号/授权/密码 |
| 网络安全 | 4+ | 白名单/安全组 |
| 参数管理 | 4+ | 参数/模板 |
| 备份恢复 | 7+ | 备份/恢复/策略 |
| **总计** | **45+** | 完整的 MongoDB 生命周期管理 |

## 🚀 快速开始

### 1. 配置环境变量

在 OpenClaw 系统中配置：
```bash
ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret
ALIBABA_CLOUD_REGION_ID=cn-hangzhou  # 可选
```

### 2. 使用示例

```javascript
const MongoDBDatabaseOperation = require('./mongodb-database-operation');

// 初始化（自动从环境变量读取 AKSK）
const mongodb = new MongoDBDatabaseOperation();

// 查询实例列表
const instances = await mongodb.describe.describeDBInstances({
  regionId: 'cn-hangzhou',
  pageNumber: 1,
  pageSize: 30
});
```

## 📚 模块说明

### 查询实例

```javascript
// 查询实例列表
const instances = await mongodb.describe.describeDBInstances({
  regionId: 'cn-hangzhou',
  pageNumber: 1,
  pageSize: 30
});

// 查询实例详情
const info = await mongodb.describe.describeDBInstanceAttribute('dds-bp1xxxx');

// 查询可用地域
const regions = await mongodb.describe.describeRegions();

// 查询可用资源
const resources = await mongodb.describe.describeAvailableResource({
  regionId: 'cn-hangzhou',
  engine: 'MongoDB',
  engineVersion: '4.4'
});
```

### 账号管理

**⚠️ 注意**: 副本集实例仅支持 root 账号，不支持创建额外账号。

```javascript
// 创建账号（⚠️ 密码必须由用户提供，仅分片集群支持）
await mongodb.accounts.createAccount({
  dbInstanceId: 'dds-bp1xxxx',
  accountName: 'myuser',
  password: 'UserProvidedPassword123', // ⚠️ 必须用户提供
  description: '业务账号'
});

// 查询账号列表
const accounts = await mongodb.accounts.describeAccounts('dds-bp1xxxx');

// 重置密码（⚠️ 新密码必须由用户提供）
await mongodb.accounts.resetAccountPassword(
  'dds-bp1xxxx',
  'myuser',
  'NewUserPassword123' // ⚠️ 必须用户提供
);
```

### 白名单管理

```javascript
// 查询白名单
const whitelist = await mongodb.security.describeDBInstanceIPArrayList('dds-bp1xxxx');

// 修改白名单（⚠️ IP 必须由用户提供）
await mongodb.security.modifySecurityIps({
  dbInstanceId: 'dds-bp1xxxx',
  securityIps: '192.168.1.1,10.0.0.0/24', // ⚠️ 必须用户提供
  securityIpGroupName: 'default'
});
```

### 备份管理

```javascript
// 查询备份列表
const backups = await mongodb.backup.describeBackups({
  dbInstanceId: 'dds-bp1xxxx'
});

// 查询备份策略
const policy = await mongodb.backup.describeBackupPolicy('dds-bp1xxxx');

// 修改备份策略
await mongodb.backup.modifyBackupPolicy({
  dbInstanceId: 'dds-bp1xxxx',
  backupTime: '22:00Z-23:00Z',
  backupPeriod: 'Monday,Wednesday,Friday',
  backupRetentionPeriod: 7
});
```

### 参数管理

```javascript
// 查询参数
const params = await mongodb.parameters.describeParameters('dds-bp1xxxx');

// 修改参数（⚠️ 参数值必须由用户确认）
await mongodb.parameters.modifyParameters({
  dbInstanceId: 'dds-bp1xxxx',
  parameters: JSON.stringify({
    parameters: [
      { name: 'parameterName', value: 'newValue' } // ⚠️ 必须用户确认
    ]
  })
});
```

## ⚠️ 重要：参数确认

### 创建实例时必须询问
1. **实例架构**: 副本集 / 分片集群
2. **地域和可用区**: 用户指定
3. **引擎版本**: 4.0 / 4.2 / 4.4 / 5.0 / 6.0
4. **实例规格**: 通过 `describeAvailableResource` 查询
5. **存储容量**: 10GB - 3000GB
6. **节点配置**: 副本集固定 3 节点，分片集群自定义
7. **付费类型**: Postpaid (按量) / Prepaid (包年)
8. **密码**: 8-32 位，至少 3 种字符（**必须由用户提供**）
9. **VPC/交换机**: 用户指定

### 创建账号时必须询问
1. **账号名称**: 用户指定（**仅分片集群支持**）
2. **密码**: 8-32 位，至少 3 种字符（**必须由用户提供**）

### 修改白名单时必须询问
1. **IP 地址**: 用户指定（**严禁随意添加**）

**⚠️ 安全提醒**:
- `0.0.0.0/0` 表示允许所有 IP，**仅限测试环境**
- 生产环境应严格限制 IP 范围

## 🔐 认证方式

### 环境变量（推荐）
```javascript
const mongodb = new MongoDBDatabaseOperation();
```

### 配置对象（优先级高于环境变量）
```javascript
const mongodb = new MongoDBDatabaseOperation({
  accessKeyId: 'LTAI...',
  accessKeySecret: '...',
  regionId: 'cn-hangzhou'
});
```

## 🐛 错误处理

```javascript
const result = await mongodb.create.createDBInstance({...params});

if (result.success) {
  console.log('成功:', result.data);
} else {
  console.error('失败:', result.error.code, result.error.message);
}
```

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|---------|
| InstanceTypeNotSupport | 实例类型不支持 | 检查实例类型（副本集/分片集群） |
| InvalidPricePlanResult.NotFound | 价格方案查询失败 | 检查规格和地域 |
| InvalidChargeType | 付费类型无效 | 使用 Postpaid 或 Prepaid |

## 📖 API 参考

详见 [API_REFERENCE.md](./API_REFERENCE.md)

## 🔗 相关链接

- [阿里云 MongoDB 官方文档](https://help.aliyun.com/product/26253.html)
- [MongoDB API 参考](https://help.aliyun.com/zh/mongodb/developer-reference/api-dds-2015-12-01-overview)

## 📄 License

MIT
