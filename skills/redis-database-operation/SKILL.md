# Redis 数据库操作 Skill

**版本**: 1.1.0  
**最后更新**: 2026-04-03

## 描述

阿里云 Redis (R-KVStore) 数据库管理技能，使用 **V1 签名机制 (HMAC-SHA1)**，提供生命周期管理、实例管理、连接管理、账号管理、网络安全、参数管理、备份恢复等 7 大章节的 API 能力。

## 签名机制

**签名版本**: V1 (HMAC-SHA1)

**API 版本**: 2015-01-01

**Endpoint**: `r-kvstore.aliyuncs.com`

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

### 1. 生命周期管理 (lifecycle) - 开源版 Redis
- `createInstance()` - 创建开源版 Redis 实例
- `deleteInstance()` - 删除开源版 Redis 实例
- `describeInstances()` - 查询实例列表
- `describeInstanceAttribute()` - 查询实例详情
- `modifyInstanceName()` - 修改实例名称
- `restartInstance()` - 重启实例
- `modifyInstanceCapacity()` - 变更容量配置
- `describeRegions()` - 查询可用地域
- `describeZones()` - 查询可用区
- `describeAvailableResource()` - 查询可用资源

### 2. 实例管理 (instances) - 云原生 Tair
- `createDBInstance()` - 创建 Tair 实例
- `deleteDBInstance()` - 删除 Tair 实例
- `describeDBInstances()` - 查询 Tair 实例
- `describeDBInstanceAttribute()` - 查询实例详情
- `modifyDBInstanceName()` - 修改实例名称
- `restartDBInstance()` - 重启实例

### 3. 连接管理 (connection)
- `describeConnectionDomain()` - 查询连接地址
- `allocatePublicConnection()` - 申请公网地址
- `releasePublicConnection()` - 释放公网地址
- `modifyConnectionDomain()` - 修改连接地址

### 4. 账号管理 (accounts)
- `createAccount()` - 创建账号
- `deleteAccount()` - 删除账号
- `describeAccounts()` - 查询账号列表
- `resetAccountPassword()` - 重置密码
- `grantAccountPrivilege()` - 授权
- `revokeAccountPrivilege()` - 撤销权限

### 5. 网络安全 (security)
- `describeSecurityIps()` - 查询 IP 白名单
- `modifySecurityIps()` - 修改 IP 白名单
- `describeSecurityGroups()` - 查询安全组
- `modifySecurityGroups()` - 修改安全组

### 6. 参数管理 (parameters)
- `describeParameters()` - 查询实例参数
- `modifyParameter()` - 修改实例参数
- `describeParameterTemplates()` - 查询参数模板
- `applyParameterTemplate()` - 应用参数模板

### 7. 备份恢复 (backup)
- `createBackup()` - 创建备份
- `deleteBackup()` - 删除备份
- `describeBackups()` - 查询备份列表
- `describeBackupPolicy()` - 查询备份策略
- `modifyBackupPolicy()` - 修改备份策略
- `restoreInstance()` - 恢复数据

## ⚠️ 关键参数确认流程

### 创建实例 - 必须询问用户

**❌ 错误示例**:
```javascript
// 不要使用默认值！
await redis.lifecycle.createInstance({
  instanceType: 2, // ❌ 未确认
  engineVersion: '6.0', // ❌ 未确认
  instanceClass: 'redis.master.small.default', // ❌ 未确认
  password: 'DefaultPass123' // ❌ 严禁默认密码
});
```

**✅ 正确流程**:

```javascript
// 1. 询问实例类型
console.log('请选择实例类型：');
console.log('  1. 社区版 (原 Redis)');
console.log('  2. 企业版 (Tair)');
const instanceType = getUserInput();

// 2. 询问引擎版本
console.log('请选择引擎版本：');
console.log('  - 社区版：6.0 / 5.0 / 4.0');
console.log('  - 企业版：6.0 / 5.0');
const engineVersion = getUserInput();

// 3. 查询可用规格并让用户选择
const resources = await redis.lifecycle.describeAvailableResource({
  regionId: userRegion,
  zoneId: userZone
});
// 展示可用规格供用户选择
const instanceClass = getUserChoice(resources);

// 4. 询问容量
console.log('请选择容量 (MB):');
console.log('  可选：256 / 512 / 1024 / 2048 / 4096 / ...');
const capacity = getUserInput();

// 5. 询问付费类型
console.log('请选择付费类型：');
console.log('  1. Postpaid (按量付费)');
console.log('  2. Prepaid (包年包月)');
const instanceChargeType = getUserChoice(['Postpaid', 'Prepaid']);

// 6. ⚠️ 密码必须由用户提供
console.log('请设置实例密码 (8-32 位，至少 3 种字符):');
console.log('  - 大写字母 (A-Z)');
console.log('  - 小写字母 (a-z)');
console.log('  - 数字 (0-9)');
console.log('  - 特殊字符 (!@#$%^&*_+-=)');
const password = getUserPassword(); // 必须用户输入

// 7. 询问网络配置（VPC）
// ✅ 推荐做法：询问用户是否要指定 VPC
console.log('请选择网络配置方式：');
console.log('  1. 自动分配 VPC（推荐）');
console.log('  2. 手动指定 VPC');
const networkChoice = getUserInput();

let vpcId, vswitchId;
if (networkChoice === '2') {
  // 用户选择手动指定
  console.log('请选择 VPC ID:');
  vpcId = getUserInput();
  console.log('请选择交换机 ID:');
  vswitchId = getUserInput();
  console.log('⚠️ 注意：请确保 VPC 和交换机在指定的可用区中，否则会导致创建失败');
}
// 如果选择自动分配，不指定 vpcId 和 vswitchId

// 8. 确认后创建
const createParams = {
  regionId: userRegion,
  zoneId: userZone,
  instanceType: instanceType,
  engineVersion: engineVersion,
  instanceClass: instanceClass,
  capacity: capacity,
  instanceChargeType: instanceChargeType,
  instanceName: userProvidedName,
  password: password // ✅ 用户提供
};

// 只有用户指定了 VPC 才添加到参数中
if (vpcId) {
  createParams.vpcId = vpcId;
  createParams.vswitchId = vswitchId;
}
// 否则不指定 vpcId/vswitchId，让系统自动分配

await redis.lifecycle.createInstance(createParams);
```

**必须确认的参数**:
| 参数 | 说明 | 示例 |
|------|------|------|
| instanceType | 实例类型 | 2=社区版 / 3=企业版 |
| engineVersion | 引擎版本 | 6.0 / 5.0 / 4.0 |
| instanceClass | 实例规格 | redis.master.small.default 等 |
| capacity | 容量 (MB) | 256 / 512 / 1024 / ... |
| instanceChargeType | 付费类型 | Postpaid / Prepaid |
| password | 密码 | **必须由用户提供** |
| vpcId/vswitchId | 网络配置 | 可选，建议让系统自动分配 |

### VPC 网络配置最佳实践

**⚠️ 重要提示**：

1. **推荐做法**：不指定 `vpcId` 和 `vswitchId`，让系统自动分配
   - 避免可用区不匹配错误（`InvalidvSwitchId`、`Zone.Closed` 等）
   - 系统会自动在指定可用区创建或选择合适的 VPC/交换机

2. **手动指定 VPC 的风险**：
   - 如果指定的 VPC/交换机不在目标可用区，会报错：`InvalidvSwitchId`
   - 如果指定可用区已售罄，会报错：`Zone.Closed`
   - 如果 VPC/交换机状态异常，会报错：`InvalidVPC.NotFound`

3. **常见错误及解决方案**：

| 错误码 | 错误信息 | 原因 | 解决方案 |
|--------|----------|------|----------|
| InvalidvSwitchId | The Specified vSwitchId zone not supported | 交换机不在指定可用区 | 不指定 VPC，让系统自动分配 |
| Zone.Closed | The specified zone is closed | 该可用区已关闭或售罄 | 更换可用区或不指定 VPC |
| InvalidVPC.NotFound | VPC or VSwitch is not valid | VPC/交换机无效 | 不指定 VPC，让系统自动分配 |

**示例代码**：
```javascript
// ✅ 推荐：不指定 VPC，让系统自动分配
await redis.lifecycle.createInstance({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h',
  instanceType: 'Redis',
  engineVersion: '5.0',
  instanceClass: 'redis.master.small.default',
  capacity: '256',
  instanceChargeType: 'PostPaid',
  instanceName: 'my-redis',
  password: 'YourPassword123'
  // 不指定 vpcId 和 vswitchId
});

// ⚠️ 手动指定（需要确保 VPC/交换机在目标可用区）
await redis.lifecycle.createInstance({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h',
  instanceType: 'Redis',
  engineVersion: '5.0',
  instanceClass: 'redis.master.small.default',
  capacity: '256',
  instanceChargeType: 'PostPaid',
  instanceName: 'my-redis',
  password: 'YourPassword123',
  vpcId: 'vpc-xxx',        // 必须在 cn-hangzhou-h
  vswitchId: 'vsw-xxx'     // 必须在 cn-hangzhou-h
});
```

### 创建账号 - 必须询问用户

**❌ 错误示例**:
```javascript
// 不要这样做！
await redis.accounts.createAccount({
  accountName: 'defaultuser', // ❌ 未确认
  password: 'DefaultPass123' // ❌ 严禁默认密码
});
```

**✅ 正确流程**:

```javascript
// 1. 询问账号名称
console.log('请输入账号名称 (字母开头，可包含字母、数字、下划线):');
const accountName = getUserInput();

// 2. 询问账号类型
console.log('请选择账号类型：');
console.log('  1. Normal - 普通账号 (推荐，用于业务应用)');
console.log('  2. Super - 高权限账号 (谨慎使用，用于 DBA 管理)');
const accountTypeChoice = getUserInput();
const accountType = accountTypeChoice === '1' ? 'Normal' : 'Super';

// 3. ⚠️ 密码必须由用户提供
console.log('请设置账号密码 (8-32 位，至少 3 种字符):');
const password = getUserPassword();

await redis.accounts.createAccount({
  instanceId: instanceId,
  accountName: accountName, // ✅ 用户确认
  accountPassword: password, // ✅ 用户提供
  accountType: accountType // ✅ 用户选择
});
```

**必须确认的参数**:
| 参数 | 说明 | 示例 |
|------|------|------|
| accountName | 账号名称 | 用户指定 |
| accountType | 账号类型 | Normal / Super |
| accountPassword | 密码 | **必须由用户提供** |

### 修改白名单 - 必须询问用户

**❌ 错误示例**:
```javascript
// 不要随意添加 IP！
await redis.security.modifySecurityIps({
  instanceId: 'r-bp1xxxx',
  securityIps: '192.168.1.1,10.0.0.0/24' // ❌ 未确认
});
```

**✅ 正确流程**:

```javascript
// 1. 先查询当前白名单
const currentWhitelist = await redis.security.describeSecurityIps(instanceId);
console.log('当前白名单:');
// 展示当前白名单

// 2. ⚠️ 询问用户要添加的 IP
console.log('请输入要添加到白名单的 IP 地址 (逗号分隔):');
console.log('示例：192.168.1.100,10.0.0.0/24');
console.log('⚠️ 注意：0.0.0.0/0 表示允许所有 IP，仅限测试使用！');
const securityIps = getUserInput(); // 必须用户输入

// 3. 询问修改模式
console.log('请选择修改模式：');
console.log('  1. Append - 追加到现有白名单');
console.log('  2. Delete - 从现有白名单删除');
console.log('  3. Overwrite - 覆盖现有白名单');
const modifyMode = getUserChoice(['Append', 'Delete', 'Overwrite']);

// 4. 确认后修改
await redis.security.modifySecurityIps({
  instanceId: instanceId,
  securityIps: securityIps, // ✅ 用户提供
  modifyMode: modifyMode // ✅ 用户选择
});
```

**必须确认的参数**:
| 参数 | 说明 | 示例 |
|------|------|------|
| securityIps | IP 地址列表 | **必须由用户提供** |
| modifyMode | 修改模式 | Append / Delete / Overwrite |

**⚠️ 安全提醒**:
- `0.0.0.0/0` 表示允许所有 IP 访问，**仅限测试环境**
- 生产环境应严格限制 IP 范围

### 修改参数 - 必须询问用户

**✅ 正确流程**:

```javascript
// 1. 先查询当前参数
const params = await redis.parameters.describeParameters(instanceId);
console.log('当前参数配置:');
// 展示参数列表

// 2. ⚠️ 询问用户要修改的参数
console.log('请输入要修改的参数名:');
const paramName = getUserInput();

console.log('请输入新值:');
const paramValue = getUserInput();

await redis.parameters.modifyParameter({
  instanceId: instanceId,
  config: JSON.stringify({
    parameters: [
      { name: paramName, value: paramValue } // ✅ 用户确认
    ]
  })
});
```

**必须确认的参数**:
| 参数 | 说明 | 示例 |
|------|------|------|
| 参数名 | 要修改的参数 | maxclients / timeout 等 |
| 参数值 | 新值 | **必须由用户确认** |

## 🔗 OpenAPI 调试

**Redis OpenAPI 调试页面**:
https://next.api.aliyun.com/api/R-KVStore/2015-01-01/DescribeInstances?params={}

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
5. 查阅 [Redis API 文档](https://help.aliyun.com/zh/redis/developer-reference/api-r-kvstore-2015-01-01-overview-redis)

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
  await redis.lifecycle.createInstance(params); // ❌ 为什么要创建 5 个？
}

// ❌ 错误：并行创建，不等待结果
Promise.all([
  redis.lifecycle.createInstance(params1),
  redis.lifecycle.createInstance(params2)
]);

// ❌ 错误：一次性删除多个实例，不等待结果
const instanceIds = ['r-xxx1', 'r-xxx2', 'r-xxx3'];
instanceIds.forEach(id => {
  redis.lifecycle.deleteInstance(id); // ❌ 没有等待结果
});
```

### ✅ 正确示例

**场景 1：用户要求创建 1 个实例**
```javascript
// ✅ 正确：只创建 1 个，等待结果
console.log('正在创建实例...');
const result = await redis.lifecycle.createInstance(params);

if (result.success) {
  console.log(`✅ 实例创建成功：${result.data.InstanceId}`);
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
  const result = await redis.lifecycle.createInstance(params);
  
  if (result.success) {
    console.log(`✅ 第 ${i} 个实例创建成功：${result.data.InstanceId}`);
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
const instancesToDelete = ['r-xxx1', 'r-xxx2', 'r-xxx3'];
console.log(`⚠️ 即将删除 ${instancesToDelete.length} 个实例，请确认：`);
instancesToDelete.forEach(id => console.log(`  - ${id}`));
const confirmed = getUserConfirmation();
if (!confirmed) {
  console.log('已取消操作');
  return;
}

// ✅ 正确：逐个删除，等待每个操作的结果
for (const instanceId of instancesToDelete) {
  const result = await redis.lifecycle.deleteInstance(instanceId);
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
const result = await redis.lifecycle.createInstance({...params});

if (result.success) {
  console.log('成功:', result.data);
} else {
  console.error('失败:', result.error.code, result.error.message);
  
  // 常见错误处理
  switch (result.error.code) {
    case 'InvalidPassword.Malformed':
      console.log('密码格式错误，需要 8-32 位，至少 3 种字符');
      break;
    case 'IncorrectInstanceStatus':
      console.log('实例状态不支持此操作，请等待实例变为 Running 状态');
      break;
    case 'OperationDenied.DeletionProtection':
      console.log('实例开启释放保护，请先关闭');
      break;
  }
}
```

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|---------|
| InvalidInstanceId.NotFound | 实例不存在 | 检查实例 ID |
| IncorrectInstanceStatus | 实例状态不支持 | 等待 Running 状态 |
| InvalidPassword.Malformed | 密码格式错误 | 检查密码复杂度 |
| OperationDenied.DeletionProtection | 开启释放保护 | 先关闭保护 |
| InvalidvSwitchId | 交换机不在指定可用区 | 不指定 VPC，让系统自动分配 |
| Zone.Closed | 该可用区已关闭或售罄 | 更换可用区或不指定 VPC |
| InvalidVPC.NotFound | VPC/交换机无效 | 不指定 VPC，让系统自动分配 |
| InvalidCapacity.NotFound | 容量规格不存在 | 查询可用资源后选择正确规格 |

## 使用示例

```javascript
const RedisDatabaseOperation = require('./redis-database-operation');

// 初始化（从环境变量读取 AKSK）
const redis = new RedisDatabaseOperation();

// 查询实例列表
const instances = await redis.lifecycle.describeInstances({
  regionId: 'cn-hangzhou',
  pageNumber: 1,
  pageSize: 30
});

// 查询实例详情
const info = await redis.lifecycle.describeInstanceAttribute('r-bp1xxxx');

// 查询白名单
const whitelist = await redis.security.describeSecurityIps('r-bp1xxxx');

// 查询参数
const params = await redis.parameters.describeParameters('r-bp1xxxx');
```

## 版本

- API 版本：2015-01-01
- Skill 版本：1.1.0
- 签名机制：V1 (HMAC-SHA1)
- Endpoint: r-kvstore.aliyuncs.com

## 相关文档

- [阿里云 Redis 官方文档](https://help.aliyun.com/product/26090.html)
- [Redis API 参考](https://help.aliyun.com/zh/redis/developer-reference/api-r-kvstore-2015-01-01-overview-redis)
- [OpenAPI 调试](https://next.api.aliyun.com/api/R-KVStore/2015-01-01/DescribeInstances)
