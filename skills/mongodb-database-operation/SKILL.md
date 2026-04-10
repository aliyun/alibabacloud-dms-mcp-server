# MongoDB 数据库操作 Skill

## 描述

阿里云 MongoDB (DDS) 数据库管理技能，使用 **V1 签名机制 (HMAC-SHA1)**，提供创建或克隆、变更配置、实例管理、查询、连接管理、资源管理、账号管理、白名单安全、参数管理、备份恢复等 10 大章节的 API 能力。

## 签名机制

**签名版本**: V1 (HMAC-SHA1)

**API 版本**: 2015-12-01

**Endpoint**: `mongodb.aliyuncs.com`

## CLI 使用策略

**当前版本不建议使用 CLI**，所有操作通过 API 完成。

| 方式 | 状态 | 说明 |
|------|------|------|
| API | ✅ 推荐 | 通过阿里云 OpenAPI 直接调用，稳定性好，可控性高 |
| CLI | ⚠️ 不推荐 | 当前版本不建议使用，未来是否可用由用户决定 |

## 环境变量

从 OpenClaw 系统环境变量获取认证信息：

```
ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret
ALIBABA_CLOUD_REGION_ID=cn-hangzhou  # 可选，默认 cn-hangzhou
```

**⚠️ 安全提醒**: 
- 不要在代码中硬编码 AKSK
- 使用 OpenClaw 环境变量或配置对象传入
- 建议使用 RAM 子账号，遵循最小权限原则

## 功能模块

### 1. 创建或克隆实例 (create)
- `createDBInstance()` - 创建实例
- `cloneDBInstance()` - 克隆实例

### 2. 变更实例配置 (modify)
- `modifyDBInstanceSpec()` - 变更规格
- `modifyDBInstanceName()` - 修改名称
- `modifyDBInstancePassword()` - 修改密码
- `modifyDBInstanceDescription()` - 修改描述
- `modifyDBInstanceMaintainTime()` - 修改维护时间

### 3. 实例管理 (instances)
- `deleteDBInstance()` - 删除实例
- `restartDBInstance()` - 重启实例
- `lockDBInstance()` / `unlockDBInstance()` - 锁定/解锁
- `modifyDBInstanceDeletionProtection()` - 释放保护

### 4. 查询实例 (describe)
- `describeDBInstances()` - 查询列表
- `describeDBInstanceAttribute()` - 查询详情
- `describeRegions()` - 查询地域
- `describeAvailableResource()` - 查询资源

### 5. 连接管理 (connection)
- `describeDBInstanceNetInfo()` - 查询连接
- `allocatePublicConnection()` - 申请公网
- `releasePublicConnection()` - 释放公网
- `switchDBInstanceNetType()` - 切换网络

### 6. 资源管理 (resources)
- `listTagResources()` - 查询标签
- `tagResources()` - 绑定标签
- `untagResources()` - 解绑标签

### 7. 账号管理 (accounts)
- `createAccount()` - 创建账号
- `deleteAccount()` - 删除账号
- `describeAccounts()` - 查询账号
- `resetAccountPassword()` - 重置密码
- `grantAccountPrivilege()` - 授权
- `revokeAccountPrivilege()` - 撤销权限

### 8. 白名单和安全组 (security)
- `describeDBInstanceIPArrayList()` - 查询白名单
- `modifySecurityIps()` - 修改白名单
- `describeDBInstanceSecurityGroups()` - 查询安全组
- `modifyDBInstanceSecurityGroups()` - 修改安全组

### 9. 参数管理 (parameters)
- `describeParameters()` - 查询参数
- `modifyParameters()` - 修改参数
- `describeParameterTemplates()` - 查询模板
- `applyParameterTemplate()` - 应用模板

### 10. 备份与恢复 (backup)
- `createBackup()` - 创建备份
- `deleteBackup()` - 删除备份
- `describeBackups()` - 查询备份
- `describeBackupPolicy()` - 查询策略
- `modifyBackupPolicy()` - 修改策略
- `restoreDBInstance()` - 恢复实例
- `restoreDBInstanceByTime()` - 按时间点恢复

## ⚠️ 关键参数确认流程

### 创建实例 - 必须询问用户

**⚠️ 重要**: MongoDB 有副本集和分片集群两种架构，参数差异较大。

**❌ 错误示例**:
```javascript
// 不要使用默认值！
await mongodb.create.createDBInstance({
  dbInstanceClass: 'dds.mongo.small', // ❌ 未确认
  dbInstanceStorage: 20, // ❌ 未确认
  password: 'DefaultPass123' // ❌ 严禁默认密码
});
```

**✅ 正确流程**:

```javascript
// 1. 询问实例架构
console.log('请选择实例架构：');
console.log('  1. 副本集 (Replica Set) - 适合中小规模应用');
console.log('  2. 分片集群 (Sharded Cluster) - 适合大规模高并发');
const architectureType = getUserInput();

// 2. 询问地域和可用区
console.log('请选择地域:');
const regions = await mongodb.describe.describeRegions();
// 展示地域列表供用户选择
const regionId = getUserChoice(regions);

console.log('请选择可用区:');
const zoneId = getUserInput();

// 3. 查询可用规格
const resources = await mongodb.describe.describeAvailableResource({
  regionId: regionId,
  zoneId: zoneId,
  engine: 'MongoDB',
  engineVersion: '4.4'
});
// 展示可用规格供用户选择
const dbInstanceClass = getUserChoice(resources);

// 4. 询问存储容量
console.log('请选择存储容量 (GB):');
console.log('  范围：10GB - 3000GB');
const dbInstanceStorage = getUserInput();

// 5. 询问节点配置
if (architectureType === '1') {
  // 副本集
  console.log('副本集节点数 (固定 3 节点):');
  const nodeAmount = 3;
} else {
  // 分片集群
  console.log('Mongos 节点数:');
  const mongosQuantity = getUserInput();
  console.log('Shard 节点数:');
  const shardQuantity = getUserInput();
}

// 6. 询问付费类型
console.log('请选择付费类型：');
console.log('  1. Postpaid (按量付费)');
console.log('  2. Prepaid (包年包月)');
const instanceChargeType = getUserChoice(['Postpaid', 'Prepaid']);

// 7. ⚠️ 密码必须由用户提供
console.log('请设置实例密码 (8-32 位，至少 3 种字符):');
console.log('  - 大写字母 (A-Z)');
console.log('  - 小写字母 (a-z)');
console.log('  - 数字 (0-9)');
console.log('  - 特殊字符 (!@#$%^&*_+-=)');
const password = getUserPassword(); // 必须用户输入

// 8. 询问网络配置
console.log('请选择 VPC ID:');
const vpcId = getUserInput();
console.log('请选择交换机 ID:');
const vswitchId = getUserInput();

// 9. 确认后创建
await mongodb.create.createDBInstance({
  regionId: regionId,
  zoneId: zoneId,
  engine: 'MongoDB',
  engineVersion: '4.4',
  dbInstanceClass: dbInstanceClass, // ✅ 用户选择
  dbInstanceStorage: dbInstanceStorage, // ✅ 用户确认
  instanceChargeType: instanceChargeType, // ✅ 用户选择
  dbInstanceName: userProvidedName,
  password: password, // ✅ 用户提供
  nodeAmount: 3, // 副本集固定 3 节点
  networkType: 'VPC',
  replicationFactor: '3',
  storageEngine: 'WiredTiger'
});
```

**必须确认的参数**:
| 参数 | 说明 | 示例 |
|------|------|------|
| engineVersion | 引擎版本 | 4.0 / 4.2 / 4.4 / 5.0 / 6.0 |
| dbInstanceClass | 实例规格 | 根据可用资源选择 |
| dbInstanceStorage | 存储 (GB) | 10-3000 |
| instanceChargeType | 付费类型 | Postpaid / Prepaid |
| password | 密码 | **必须由用户提供** |
| nodeAmount | 节点数 | 副本集=3 / 分片集群自定义 |
| vpcId/vswitchId | 网络配置 | 用户指定 |

### 创建账号 - 必须询问用户

**⚠️ 重要**: 
- **副本集实例**: 仅支持 root 账号，不支持创建额外账号
- **分片集群实例**: 支持创建多个账号

**❌ 错误示例**:
```javascript
// 副本集实例不支持创建账号！
await mongodb.accounts.createAccount({
  dbInstanceId: 'dds-bp1xxxx', // ❌ 副本集实例
  accountName: 'myuser',
  password: 'DefaultPass123'
});
```

**✅ 正确流程**:

```javascript
// 1. 先查询实例类型
const instanceInfo = await mongodb.describe.describeDBInstanceAttribute(instanceId);
const instanceType = instanceInfo.data.DBInstances.DBInstance[0].InstanceType;

if (instanceType === 'replicate') {
  console.log('⚠️ 副本集实例仅支持 root 账号，不支持创建额外账号');
  return;
}

// 2. 询问账号名称
console.log('请输入账号名称 (字母开头，可包含字母、数字、下划线):');
const accountName = getUserInput();

// 3. ⚠️ 密码必须由用户提供
console.log('请设置账号密码 (8-32 位，至少 3 种字符):');
const password = getUserPassword();

await mongodb.accounts.createAccount({
  dbInstanceId: instanceId,
  accountName: accountName, // ✅ 用户确认
  accountPassword: password, // ✅ 用户提供
  accountDescription: userProvidedDesc
});
```

**必须确认的参数**:
| 参数 | 说明 | 示例 |
|------|------|------|
| accountName | 账号名称 | 用户指定 |
| accountPassword | 密码 | **必须由用户提供** |

### 修改白名单 - 必须询问用户

**❌ 错误示例**:
```javascript
// 不要随意添加 IP！
await mongodb.security.modifySecurityIps({
  dbInstanceId: 'dds-bp1xxxx',
  securityIps: '192.168.1.1,10.0.0.0/24' // ❌ 未确认
});
```

**✅ 正确流程**:

```javascript
// 1. 先查询当前白名单
const whitelist = await mongodb.security.describeDBInstanceIPArrayList(instanceId);
console.log('当前白名单:');
// 展示当前白名单

// 2. ⚠️ 询问用户要添加的 IP
console.log('请输入要添加到白名单的 IP 地址 (逗号分隔):');
console.log('示例：192.168.1.100,10.0.0.0/24');
console.log('⚠️ 注意：0.0.0.0/0 表示允许所有 IP，仅限测试使用！');
const securityIps = getUserInput(); // 必须用户输入

// 3. 确认后修改
await mongodb.security.modifySecurityIps({
  dbInstanceId: instanceId,
  securityIps: securityIps, // ✅ 用户提供
  securityIpGroupName: 'default'
});
```

**必须确认的参数**:
| 参数 | 说明 | 示例 |
|------|------|------|
| securityIps | IP 地址列表 | **必须由用户提供** |

**⚠️ 安全提醒**:
- `0.0.0.0/0` 表示允许所有 IP 访问，**仅限测试环境**
- 生产环境应严格限制 IP 范围

### 修改参数 - 必须询问用户

**✅ 正确流程**:

```javascript
// 1. 先查询当前参数
const params = await mongodb.parameters.describeParameters(instanceId);
console.log('当前参数配置:');
// 展示参数列表

// 2. ⚠️ 询问用户要修改的参数
console.log('请输入要修改的参数名:');
const paramName = getUserInput();

console.log('请输入新值:');
const paramValue = getUserInput();

await mongodb.parameters.modifyParameters({
  dbInstanceId: instanceId,
  parameters: JSON.stringify({
    parameters: [
      { name: paramName, value: paramValue } // ✅ 用户确认
    ]
  })
});
```

**必须确认的参数**:
| 参数 | 说明 | 示例 |
|------|------|------|
| 参数名 | 要修改的参数 | 用户指定 |
| 参数值 | 新值 | **必须由用户确认** |

## 🔗 OpenAPI 调试

**MongoDB OpenAPI 调试页面**:
https://next.api.aliyun.com/api/MongoDB/2015-12-01/DescribeDBInstances?params={}

**使用说明**:
1. 在 OpenAPI 调试页面选择要调用的 API
2. 填入必要的参数（如 RegionId）
3. 点击"运行"查看返回结果和请求参数
4. 对比 Skill 调用时的参数，确认是否一致

**调用失败时**:
1. 检查返回的错误码和错误信息
2. 在 OpenAPI 调试页面使用相同参数重试
3. 对比参数名称、类型是否一致
4. 检查 RegionId、实例 ID 等必填参数是否正确
5. 查阅 [MongoDB API 文档](https://help.aliyun.com/zh/mongodb/developer-reference/api-dds-2015-12-01-overview)

## ⚠️ 批量操作安全规范

### 🔴 核心原则

**严格按用户要求执行，不要自己乱试！**

1. **用户说创建 1 个，就创建 1 个** —— 不要自己循环创建多个
2. **用户说创建 3 个，就创建 3 个** —— 不要多也不要少
3. **每次操作后等待结果** —— 确认成功后再决定下一步
4. **失败时立即停止** —— 不要继续执行，先问用户

### ❌ 错误示例 (不要这样做！)

```javascript
// ❌ 错误：用户没要求，自己循环创建多个实例
for (let i = 0; i < 5; i++) {
  await mongodb.create.createDBInstance(params); // ❌ 为什么要创建 5 个？
}

// ❌ 错误：并行创建，不等待结果
Promise.all([
  mongodb.create.createDBInstance(params1),
  mongodb.create.createDBInstance(params2)
]);

// ❌ 错误：一次性删除多个实例，不等待结果
const instanceIds = ['dds-xxx1', 'dds-xxx2', 'dds-xxx3'];
instanceIds.forEach(id => {
  mongodb.instances.deleteDBInstance(id); // ❌ 没有等待结果
});
```

### ✅ 正确示例

**场景 1：用户要求创建 1 个实例**
```javascript
// ✅ 正确：只创建 1 个，等待结果
console.log('正在创建实例...');
const result = await mongodb.create.createDBInstance(params);

if (result.success) {
  console.log(`✅ 实例创建成功：${result.data.DBInstanceId}`);
  // 任务完成，不要继续创建
} else {
  console.error(`❌ 实例创建失败：${result.error.message}`);
  // 失败时停止，询问用户
}
```

**场景 2：用户明确要求创建多个实例**
```javascript
// ✅ 正确：用户要求创建 3 个，逐个执行并确认
const count = 3; // 用户明确要求的数量
for (let i = 1; i <= count; i++) {
  console.log(`正在创建第 ${i}/${count} 个实例...`);
  const result = await mongodb.create.createDBInstance(params);
  
  if (result.success) {
    console.log(`✅ 第 ${i} 个实例创建成功：${result.data.DBInstanceId}`);
  } else {
    console.error(`❌ 第 ${i} 个实例创建失败：${result.error.message}`);
    const shouldContinue = getUserConfirmation(`已失败 ${i}/${count}，是否继续？`);
    if (!shouldContinue) break;
  }
}
```

**场景 3：批量删除**
```javascript
// ✅ 正确：批量删除前，先确认数量
const instancesToDelete = ['dds-xxx1', 'dds-xxx2', 'dds-xxx3'];
console.log(`⚠️ 即将删除 ${instancesToDelete.length} 个实例，请确认：`);
instancesToDelete.forEach(id => console.log(`  - ${id}`));
const confirmed = getUserConfirmation();
if (!confirmed) {
  console.log('已取消操作');
  return;
}

// ✅ 正确：逐个删除，等待每个操作的结果
for (const instanceId of instancesToDelete) {
  const result = await mongodb.instances.deleteDBInstance(instanceId);
  if (result.success) {
    console.log(`✅ 实例 ${instanceId} 删除成功`);
  } else {
    console.error(`❌ 删除失败：${result.error.message}`);
    const shouldContinue = getUserConfirmation('是否继续？');
    if (!shouldContinue) break;
  }
}
```

### 批量操作检查清单

**执行前**:
- [ ] 明确告知用户要操作的数量
- [ ] 列出所有操作对象的 ID/名称
- [ ] 获得用户明确确认
- [ ] 提醒用户这是不可逆操作（删除时）

**执行中**:
- [ ] 逐个执行，不要并行
- [ ] 等待每个操作的结果返回
- [ ] 检查每个操作的成功/失败状态
- [ ] 失败时立即停止并询问用户

**执行后**:
- [ ] 汇总报告成功/失败数量
- [ ] 列出失败的操作及原因

---

## 错误处理

```javascript
const result = await mongodb.create.createDBInstance({...params});

if (result.success) {
  console.log('成功:', result.data);
} else {
  console.error('失败:', result.error.code, result.error.message);
  
  // 常见错误处理
  switch (result.error.code) {
    case 'InstanceTypeNotSupport':
      console.log('该实例类型不支持此操作（如副本集不支持创建账号）');
      break;
    case 'InvalidPricePlanResult.NotFound':
      console.log('价格方案查询失败，请检查规格和地域');
      break;
    case 'InvalidChargeType':
      console.log('付费类型无效，使用 Postpaid 或 Prepaid');
      break;
  }
}
```

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|---------|
| InvalidDBInstanceId.NotFound | 实例不存在 | 检查实例 ID |
| InstanceTypeNotSupport | 实例类型不支持 | 检查实例类型（副本集/分片集群） |
| InvalidPricePlanResult.NotFound | 价格方案查询失败 | 检查规格和地域 |
| InvalidChargeType | 付费类型无效 | 使用 Postpaid 或 Prepaid |
| InvalidvSwitchId | 交换机不在指定可用区 | 不指定 VPC，让系统自动分配 |
| Zone.Closed | 该可用区已关闭或售罄 | 更换可用区或不指定 VPC |
| InvalidVPC.NotFound | VPC/交换机无效 | 不指定 VPC，让系统自动分配 |

## 使用示例

```javascript
const MongoDBDatabaseOperation = require('./mongodb-database-operation');

// 初始化（从环境变量读取 AKSK）
const mongodb = new MongoDBDatabaseOperation();

// 查询实例列表
const instances = await mongodb.describe.describeDBInstances({
  regionId: 'cn-hangzhou',
  pageNumber: 1,
  pageSize: 30
});

// 查询实例详情
const info = await mongodb.describe.describeDBInstanceAttribute('dds-bp1xxxx');

// 查询白名单
const whitelist = await mongodb.security.describeDBInstanceIPArrayList('dds-bp1xxxx');

// 查询参数
const params = await mongodb.parameters.describeParameters('dds-bp1xxxx');

// 查询备份
const backups = await mongodb.backup.describeBackups({
  dbInstanceId: 'dds-bp1xxxx'
});
```

## 版本

- API 版本：2015-12-01
- Skill 版本：1.1.0
- 签名机制：V1 (HMAC-SHA1)
- Endpoint: mongodb.aliyuncs.com

## 相关文档

- [阿里云 MongoDB 官方文档](https://help.aliyun.com/product/26253.html)
- [MongoDB API 参考](https://help.aliyun.com/zh/mongodb/developer-reference/api-dds-2015-12-01-overview)
- [OpenAPI 调试](https://next.api.aliyun.com/api/MongoDB/2015-12-01/DescribeDBInstances)
