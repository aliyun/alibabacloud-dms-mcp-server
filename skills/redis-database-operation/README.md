# Redis 数据库操作 Skill

阿里云 Redis (R-KVStore) 数据库管理技能，使用 **V1 签名机制 (HMAC-SHA1)**，提供 7 大功能模块共计 40+ 个 API。

## 📋 功能概览

| 模块 | API 数量 | 核心功能 |
|------|---------|---------|
| 生命周期管理 | 10+ | 开源版 Redis 实例创建/删除/查询 |
| 实例管理 | 6+ | 云原生 Tair 实例管理 |
| 连接管理 | 4+ | 连接地址管理 |
| 账号管理 | 6+ | 账号创建/授权/密码重置 |
| 网络安全 | 6+ | 白名单/SSL/安全组 |
| 参数管理 | 4+ | 参数查询/修改/模板 |
| 备份恢复 | 6+ | 备份/恢复/策略 |
| **总计** | **40+** | 完整的 Redis 生命周期管理 |

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
const RedisDatabaseOperation = require('./redis-database-operation');

// 初始化（自动从环境变量读取 AKSK）
const redis = new RedisDatabaseOperation();

// 查询实例列表
const instances = await redis.lifecycle.describeInstances({
  regionId: 'cn-hangzhou',
  pageNumber: 1,
  pageSize: 30
});
```

## 📚 模块说明

### 生命周期管理 (lifecycle) - 开源版 Redis

```javascript
// 查询实例列表
const instances = await redis.lifecycle.describeInstances({
  regionId: 'cn-hangzhou',
  pageNumber: 1,
  pageSize: 30
});

// 查询实例详情
const info = await redis.lifecycle.describeInstanceAttribute('r-bp1xxxx');

// 重启实例
await redis.lifecycle.restartInstance('r-bp1xxxx');
```

### 实例管理 (instances) - 云原生 Tair

```javascript
// 查询 Tair 实例
const tairInstances = await redis.instances.describeDBInstances({
  regionId: 'cn-hangzhou'
});
```

### 连接管理

```javascript
// 查询连接地址
const conn = await redis.connection.describeConnectionDomain('r-bp1xxxx');

// 申请公网地址
await redis.connection.allocatePublicConnection('r-bp1xxxx');

// 释放公网地址
await redis.connection.releasePublicConnection('r-bp1xxxx', 'public-address');
```

### 账号管理

```javascript
// 创建账号（⚠️ 密码必须由用户提供）
await redis.accounts.createAccount({
  instanceId: 'r-bp1xxxx',
  accountName: 'myuser',
  accountPassword: 'UserProvidedPassword123', // ⚠️ 必须用户提供（也支持 password 参数名）
  accountType: 'Normal', // Normal 或 Super
  description: '业务账号'
});

// 查询账号列表
const accounts = await redis.accounts.describeAccounts('r-bp1xxxx');

// 重置密码（⚠️ 新密码必须由用户提供）
await redis.accounts.resetAccountPassword(
  'r-bp1xxxx',
  'myuser',
  'NewUserPassword123' // ⚠️ 必须用户提供
);
```

### 网络安全

```javascript
// 查询白名单
const whitelist = await redis.security.describeSecurityIps('r-bp1xxxx');

// 修改白名单（⚠️ IP 必须由用户提供）
await redis.security.modifySecurityIps({
  instanceId: 'r-bp1xxxx',
  securityIps: '192.168.1.1,10.0.0.0/24', // ⚠️ 必须用户提供
  modifyMode: 'Append' // Append/Delete/Overwrite
});

// 开启 SSL
await redis.security.modifySSL('r-bp1xxxx', 'Open');
```

### 参数管理

```javascript
// 查询参数
const params = await redis.parameters.describeParameters('r-bp1xxxx');

// 修改参数（⚠️ 参数值必须由用户确认）
await redis.parameters.modifyParameter({
  instanceId: 'r-bp1xxxx',
  config: JSON.stringify({
    parameters: [
      { name: 'maxclients', value: '10000' } // ⚠️ 必须用户确认
    ]
  }),
  forceRestart: 'false' // 是否需要重启
});
```

### 备份恢复

```javascript
// 创建备份
await redis.backup.createBackup({
  instanceId: 'r-bp1xxxx',
  backupStrategy: 'Manual',
  backupName: 'manual_backup'
});

// 查询备份
const backups = await redis.backup.describeBackups({
  instanceId: 'r-bp1xxxx',
  pageNumber: 1,
  pageSize: 10
});

// 修改备份策略
await redis.backup.modifyBackupPolicy({
  instanceId: 'r-bp1xxxx',
  backupTime: '22:00Z-23:00Z',
  backupPeriod: 'Monday,Wednesday,Friday',
  backupRetentionPeriod: 7
});
```

## ⚠️ 重要：参数确认

### 创建实例时必须询问
1. **实例类型**: 社区版 / 企业版 (Tair)
2. **引擎版本**: 6.0 / 5.0 / 4.0
3. **实例规格**: 通过 `describeAvailableResource` 查询可用规格
4. **容量**: 256MB / 512MB / 1GB / 2GB / ...
5. **付费类型**: Postpaid (按量) / Prepaid (包年)
6. **密码**: 8-32 位，至少 3 种字符（**必须由用户提供**）
7. **VPC/交换机**: 用户指定

### 创建账号时必须询问
1. **账号名称**: 用户指定
2. **账号类型**: Normal (普通) / Super (高权限)
3. **密码**: 8-32 位，至少 3 种字符（**必须由用户提供**）

### 修改白名单时必须询问
1. **IP 地址**: 用户指定（**严禁随意添加**）
2. **修改模式**: Append (追加) / Delete (删除) / Overwrite (覆盖)

**⚠️ 安全提醒**:
- `0.0.0.0/0` 表示允许所有 IP，**仅限测试环境**
- 生产环境应严格限制 IP 范围

## 🔐 认证方式

### 环境变量（推荐）
```javascript
const redis = new RedisDatabaseOperation();
```

### 配置对象（优先级高于环境变量）
```javascript
const redis = new RedisDatabaseOperation({
  accessKeyId: 'LTAI...',
  accessKeySecret: '...',
  regionId: 'cn-hangzhou'
});
```

## 🐛 错误处理

```javascript
const result = await redis.lifecycle.createInstance({...params});

if (result.success) {
  console.log('成功:', result.data);
} else {
  console.error('失败:', result.error.code, result.error.message);
}
```

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|---------|
| InvalidInstanceId.NotFound | 实例不存在 | 检查实例 ID |
| IncorrectInstanceStatus | 实例状态不支持 | 等待 Running 状态 |
| InvalidPassword.Malformed | 密码格式错误 | 检查密码复杂度 |
| OperationDenied.DeletionProtection | 开启释放保护 | 先关闭保护 |

## 📖 API 参考

详见 [API_REFERENCE.md](./API_REFERENCE.md)

## 🔗 相关链接

- [阿里云 Redis 官方文档](https://help.aliyun.com/product/26090.html)
- [Redis API 参考](https://help.aliyun.com/zh/redis/developer-reference/api-r-kvstore-2015-01-01-overview-redis)
- [Tair 产品文档](https://help.aliyun.com/product/26340.html)

## 📄 License

MIT
