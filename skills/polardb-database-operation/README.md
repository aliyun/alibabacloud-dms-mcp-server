# PolarDB 数据库操作 Skill

阿里云 PolarDB 云原生数据库管理技能，使用 **V1 签名机制 (HMAC-SHA1)**，提供集群、账号、数据库、备份、白名单、连接诊断、访问地址、参数管理等 8 大章节的 API 能力。

## 📋 功能概览

| 模块 | API 数量 | 核心功能 |
|------|---------|---------|
| 集群管理 | 10+ | 创建/删除/查询/重启集群 |
| 账号管理 | 10+ | 创建/删除/授权/密码重置 |
| 数据库管理 | 8+ | 创建/删除/查询/修改 |
| 白名单管理 | 5+ | 查询/修改 IP 白名单 |
| 备份管理 | 8+ | 创建备份/恢复/策略配置 |
| 访问地址 | 6+ | 公网地址申请/释放 |
| 连接诊断 | 5+ | 连接性测试/SSL 管理 |
| 参数管理 | 8+ | 查询/修改参数、参数模板管理 |
| **总计** | **60+** | 完整的 PolarDB 生命周期管理 |

## 🚀 快速开始

### 1. 配置 OpenClaw 环境变量

在 OpenClaw Gateway 配置或会话环境变量中设置：

```
ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret
ALIBABA_CLOUD_REGION_ID=cn-hangzhou  # 可选，默认 cn-hangzhou
```

**注意**: 这些是 OpenClaw 系统的环境变量，不是操作系统环境变量。

### 2. 安装依赖

```bash
cd polardb-database-operation
npm install
```

### 3. 使用示例

```javascript
const PolarDBDatabaseOperation = require('./polardb-database-operation');

// 初始化客户端（自动从环境变量读取 AKSK）
const polardb = new PolarDBDatabaseOperation();

// 查询集群列表
const clusters = await polardb.clusters.describeClusters();
console.log(clusters);
```

## 📚 模块说明

### 集群管理 (clusters)

```javascript
// 创建集群
const cluster = await polardb.clusters.createCluster({
  dbType: 'MySQL',
  dbVersion: '8.0',
  payType: 'Postpaid',
  dbNodeClass: 'polar.mysql.x4.medium',
  dbNodes: 2
});

// 查询集群
const info = await polardb.clusters.describeClusterAttribute('pc-xxxx');

// 删除集群
await polardb.clusters.deleteCluster('pc-xxxx');
```

### 账号管理 (accounts)

```javascript
// 创建账号（必须询问账号类型）
await polardb.accounts.createAccount({
  dbClusterId: 'pc-xxxx',
  accountName: 'myuser',
  accountPassword: 'MyPass123',
  accountType: 'Normal' // Normal 或 Super，必须询问用户
});

// 删除账号
await polardb.accounts.deleteAccount('pc-xxxx', 'myuser');
```

### 数据库管理 (databases)

```javascript
// 创建数据库（必须询问字符集）
await polardb.databases.createDatabase({
  dbClusterId: 'pc-xxxx',
  dbName: 'mydb',
  characterSetName: 'utf8mb4' // utf8mb4/utf8/gbk，推荐 utf8mb4
});

// 删除数据库
await polardb.databases.deleteDatabase('pc-xxxx', 'mydb');
```

### 白名单管理 (whitelist)

```javascript
// 查询白名单
const whitelist = await polardb.whitelist.describeWhitelist('pc-xxxx');

// 修改白名单
await polardb.whitelist.modifyWhitelist({
  dbClusterId: 'pc-xxxx',
  securityIps: '192.168.1.1,10.0.0.0/24'
});
```

### 备份管理 (backup)

```javascript
// 创建备份
await polardb.backup.createBackup({
  dbClusterId: 'pc-xxxx',
  backupType: 'Snapshot',
  backupName: 'manual_backup'
});

// 查询备份
await polardb.backup.describeBackups({
  dbClusterId: 'pc-xxxx',
  pageNumber: 1,
  pageSize: 10
});
```

### 访问地址管理 (endpoints)

```javascript
// 创建公网地址
await polardb.endpoints.createPublicConnection('pc-xxxx', 'my-polar', '3306');

// 释放公网地址
await polardb.endpoints.deletePublicConnection('pc-xxxx', 'my-polar.polardb.rds.aliyuncs.com');
```

### 连接诊断 (connection)

```javascript
// 连接性测试
await polardb.connection.describeClusterConnectivity('pc-xxxx', '192.168.1.1');

// 查询 SSL 状态
await polardb.connection.describeClusterSSL('pc-xxxx');

// 修改 SSL 状态
await polardb.connection.modifyClusterSSL('pc-xxxx', true); // true=开启，false=关闭
```

### 参数管理 (parameters)

```javascript
// 查询集群参数列表
const params = await polardb.parameters.describeDBClusterConfig('pc-xxxx');
console.log('当前参数配置:', params.data.Items.DBClusterParameter);

// 修改集群参数（支持批量）
await polardb.parameters.modifyDBClusterConfig({
  dbClusterId: 'pc-xxxx',
  parameters: [
    { name: 'max_connections', value: '2000' },
    { name: 'wait_timeout', value: '28800' }
  ],
  forceRestart: 'false' // 是否需要重启
});

// 查询参数模板列表
const templates = await polardb.parameters.describeParameterGroups({
  dbType: 'MySQL',
  dbVersion: '8.0'
});

// 创建参数模板
const template = await polardb.parameters.createParameterGroup({
  parameterGroupName: 'my_custom_template',
  dbType: 'MySQL',
  dbVersion: '8.0',
  parameters: [
    { name: 'max_connections', value: '2000' },
    { name: 'innodb_buffer_pool_size', value: '1073741824' }
  ],
  description: '自定义高性能参数模板'
});

// 修改参数模板
await polardb.parameters.modifyParameterGroup({
  parameterGroupId: 'pg-xxxx',
  parameterGroupName: 'updated_template',
  parameters: [
    { name: 'max_connections', value: '3000' }
  ]
});

// 应用参数模板到集群
await polardb.parameters.applyParameterGroup({
  parameterGroupId: 'pg-xxxx',
  dbClusterId: 'pc-xxxx'
});

// 删除参数模板
await polardb.parameters.deleteParameterGroup('pg-xxxx');
```

**⚠️ 参数修改注意事项**：
- 部分参数修改后需要重启集群才能生效
- 修改前建议使用 `describeDBClusterConfig` 查看当前值和可修改范围
- 生产环境修改参数前建议先备份集群

## 🔐 认证方式

### 方式一：环境变量（推荐）

```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID="LTAI..."
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="..."
export ALIBABA_CLOUD_REGION_ID="cn-hangzhou"
```

```javascript
const polardb = new PolarDBDatabaseOperation();
```

### 方式二：配置对象（优先级高于环境变量）

```javascript
const polardb = new PolarDBDatabaseOperation({
  accessKeyId: 'LTAI...',
  accessKeySecret: '...',
  regionId: 'cn-hangzhou'
});
```

### RAM 权限策略

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "polardb:*",
      "Resource": "*"
    }
  ]
}
```

## ⚠️ 重要：关键参数确认

使用本 Skill 时，以下参数**必须询问用户**，不能使用默认值：

### 创建账号
```javascript
// ❌ 错误：不询问账号类型
await polardb.accounts.createAccount({
  accountName: 'myuser',
  accountPassword: 'MyPass123'
  // accountType 未指定！
});

// ✅ 正确：先询问
console.log('请选择账号类型：Normal（普通）或 Super（高权限）？');
const accountType = getUserInput();
await polardb.accounts.createAccount({
  accountName: 'myuser',
  accountPassword: userPassword,
  accountType: accountType // 用户选择
});
```

**账号类型说明**:
- **Normal（普通账号）**: 只能管理普通数据库，无法执行高危操作，推荐使用
- **Super（高权限账号）**: 拥有最高权限，可以创建/删除数据库、修改实例参数，谨慎使用

### 创建数据库
```javascript
// ❌ 错误：不询问字符集
await polardb.databases.createDatabase({
  dbName: 'mydb',
  characterSetName: 'utf8' // 默认值，可能不支持 emoji
});

// ✅ 正确：先询问
console.log('请选择字符集：utf8mb4（推荐）或 utf8？');
const charset = getUserInput();
await polardb.databases.createDatabase({
  dbName: 'mydb',
  characterSetName: charset // 用户选择
});
```

**字符集说明**:
- **utf8mb4**: 4 字节编码，支持 emoji、生僻字，**推荐使用**
- **utf8**: 3 字节编码，不支持 emoji
- **gbk**: 中文字符集，适用于只包含中文的场景

### 创建集群
```javascript
// ❌ 错误：不询问关键参数
await polardb.clusters.createCluster({
  dbType: 'MySQL', // 默认
  dbVersion: '8.0' // 默认
});

// ✅ 正确：逐一确认
const dbType = getUserChoice(['MySQL', 'PostgreSQL', 'Oracle']);
const dbVersion = getUserChoice(await getVersions(dbType));
const payType = getUserChoice(['Postpaid', 'Prepaid']);

await polardb.clusters.createCluster({
  dbType, dbVersion, payType, ...
});
```

## 🐛 错误处理

```javascript
const result = await polardb.clusters.createCluster({...params});

if (result.success) {
  console.log('成功:', result.data);
} else {
  console.error('失败:', result.error.code, result.error.message);
}
```

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|---------|
| InvalidDBClusterId.NotFound | 集群不存在 | 检查集群 ID 是否正确 |
| IncorrectDBClusterStatus | 集群状态不支持 | 等待集群变为 Running 状态 |
| OperationDenied.DeletionProtection | 开启释放保护 | 先关闭释放保护 |
| AccountLimitExceeded | 超过账号数量上限 | 删除不需要的账号 |

## 🔗 相关链接

- [阿里云 PolarDB 官方文档](https://help.aliyun.com/product/54718.html)
- [PolarDB API 参考](https://help.aliyun.com/zh/polardb/developer-reference/api-overview-1)
- [实例规格表](https://help.aliyun.com/zh/polardb/product-overview/instance-types)

## 📄 License

MIT

## 📞 技术支持

如有问题，请提交 Issue 或联系阿里云技术支持。
