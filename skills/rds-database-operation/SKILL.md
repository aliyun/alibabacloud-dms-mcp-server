# RDS 数据库操作 Skill

## 描述

阿里云 RDS（Relational Database Service）数据库管理技能，使用 **V1 签名机制 (HMAC-SHA1)**，提供实例管理、账号管理、数据库管理、安全加密、网络与连接、备份管理、参数管理等 7 大章节的 API 能力。

## 签名机制

**签名版本**: V1 (HMAC-SHA1)

**API 版本**: 2014-08-15

**Endpoint**: `rds.aliyuncs.com`

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

### 1. 实例管理 (instances)
- `createInstance()` - 创建实例
- `deleteInstance()` - 删除实例
- `describeInstances()` - 查询实例列表
- `describeInstanceAttribute()` - 查询实例详情
- `modifyInstanceName()` - 修改实例名称
- `restartInstance()` - 重启实例
- `modifyInstanceSpec()` - 变更规格
- `modifyInstanceDescription()` - 修改描述
- `describeRegions()` - 查询地域
- `describeZones()` - 查询可用区
- `describeAvailableZones()` - 查询可用区

### 2. 账号管理 (accounts)
- `createAccount()` - 创建账号
- `deleteAccount()` - 删除账号
- `describeAccounts()` - 查询账号列表
- `resetAccountPassword()` - 重置密码
- `grantAccountPrivilege()` - 授权
- `revokeAccountPrivilege()` - 撤销权限
- `describeAccountPrivileges()` - 查询账号权限

### 3. 数据库管理 (databases)
- `createDatabase()` - 创建数据库
- `deleteDatabase()` - 删除数据库
- `describeDatabases()` - 查询数据库列表
- `modifyDatabaseDescription()` - 修改描述
- `describeCharacterSets()` - 查询字符集

### 4. 安全加密 (security)
- `describeSecurityIps()` - 查询 IP 白名单
- `modifySecurityIps()` - 修改 IP 白名单
- `describeSSL()` - 查询 SSL 状态
- `modifySSL()` - 修改 SSL 状态
- `describeSecurityGroups()` - 查询安全组
- `modifySecurityGroups()` - 修改安全组

### 5. 网络与连接 (network)
- `describeDBInstanceNetInfo()` - 查询连接信息
- `allocatePublicConnection()` - 申请公网地址
- `releasePublicConnection()` - 释放公网地址
- `modifyDBInstanceConnectionString()` - 修改连接地址

### 6. 备份管理 (backup)
- `createBackup()` - 创建备份
- `deleteBackup()` - 删除备份
- `describeBackups()` - 查询备份列表
- `describeBackupPolicy()` - 查询备份策略
- `modifyBackupPolicy()` - 修改备份策略
- `describeBinlogFiles()` - 查询 Binlog 文件

### 7. 参数管理 (parameters)
- `describeParameters()` - 查询实例参数
- `modifyParameter()` - 修改实例参数
- `describeParameterGroups()` - 查询参数模板
- `createParameterGroup()` - 创建参数模板
- `modifyParameterGroup()` - 修改参数模板
- `deleteParameterGroup()` - 删除参数模板
- `applyParameterToInstance()` - 应用参数模板

## ⚠️ 关键参数确认流程

### 创建实例 - 必须询问用户

**❌ 错误示例** (不要这样做):
```javascript
// 不要使用默认值！
await rds.instances.createInstance({
  engine: 'MySQL', // ❌ 未确认
  engineVersion: '8.0', // ❌ 未确认
  dbInstanceClass: 'mysql.n2.small.2c', // ❌ 未确认
  password: 'DefaultPass123' // ❌ 严禁使用默认密码
});
```

**✅ 正确流程**:

```javascript
// 1. 询问数据库类型
console.log('请选择数据库类型：');
console.log('  1. MySQL');
console.log('  2. PostgreSQL');
console.log('  3. SQLServer');
console.log('  4. MariaDB');
const engine = getUserInput();

// 2. 询问引擎版本
console.log('请选择引擎版本：');
const engineVersion = getUserInput();

// 3. 查询可用规格并让用户选择
const resources = await rds.instances.describeAvailableZones({
  regionId: userRegion,
  engine: engine,
  engineVersion: engineVersion
});
// 展示可用规格供用户选择
const dbInstanceClass = getUserChoice(resources);

// 4. 询问存储容量
console.log('请选择存储容量 (GB):');
const dbInstanceStorage = getUserInput();

// 5. 询问付费类型
console.log('请选择付费类型：');
console.log('  1. Postpaid (按量付费)');
console.log('  2. Prepaid (包年包月)');
const payType = getUserChoice(['Postpaid', 'Prepaid']);

// 6. ⚠️ 密码必须由用户提供
console.log('请设置实例密码 (8-32 位，至少 3 种字符):');
console.log('  - 大写字母 (A-Z)');
console.log('  - 小写字母 (a-z)');
console.log('  - 数字 (0-9)');
console.log('  - 特殊字符 (!@#$%^&*_+-=)');
const password = getUserPassword(); // 必须用户输入

// 7. 询问网络配置
console.log('请选择 VPC ID:');
const vpcId = getUserInput();
console.log('请选择交换机 ID:');
const vSwitchId = getUserInput();

// 8. 确认后创建
await rds.instances.createInstance({
  regionId: userRegion,
  engine: engine,
  engineVersion: engineVersion,
  dbInstanceClass: dbInstanceClass,
  dbInstanceStorage: dbInstanceStorage,
  payType: payType,
  dbInstanceDescription: userProvidedName,
  password: password, // ✅ 用户提供
  vpcId: vpcId,
  vSwitchId: vSwitchId
});
```

**必须确认的参数**:
| 参数 | 说明 | 示例 |
|------|------|------|
| engine | 数据库类型 | MySQL / PostgreSQL / SQLServer / MariaDB |
| engineVersion | 引擎版本 | 8.0 / 5.7 / 14.0 等 |
| dbInstanceClass | 实例规格 | mysql.n2.small.2c 等 |
| dbInstanceStorage | 存储 (GB) | 20-3000 |
| payType | 付费类型 | Postpaid / Prepaid |
| password | 密码 | **必须由用户提供** |
| vpcId/vSwitchId | 网络配置 | 用户指定 |

### 创建账号 - 必须询问用户

**❌ 错误示例**:
```javascript
// 不要这样做！
await rds.accounts.createAccount({
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

// 4. 询问描述 (可选)
console.log('请输入账号描述 (可选):');
const description = getUserInput();

await rds.accounts.createAccount({
  dbInstanceId: instanceId,
  accountName: accountName, // ✅ 用户确认
  accountPassword: password, // ✅ 用户提供
  accountType: accountType, // ✅ 用户选择
  accountDescription: description
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
await rds.security.modifySecurityIps({
  dbInstanceId: 'rm-bp1xxxx',
  securityIps: '192.168.1.1,10.0.0.0/24' // ❌ 未确认
});
```

**✅ 正确流程**:

```javascript
// 1. 先查询当前白名单
const currentWhitelist = await rds.security.describeSecurityIps(instanceId);
console.log('当前白名单:');
currentWhitelist.data.Items?.DBInstanceIPArrayList?.forEach(group => {
  console.log(`  - ${group.SecurityIpGroupName}: ${group.SecurityIps}`);
});

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
const modeChoice = getUserInput();
const modifyMode = ['Append', 'Delete', 'Overwrite'][modeChoice - 1];

// 4. 确认后修改
await rds.security.modifySecurityIps({
  dbInstanceId: instanceId,
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
- 修改前建议先查询当前白名单

### 修改参数 - 必须询问用户

**❌ 错误示例**:
```javascript
// 不要随意修改参数！
await rds.parameters.modifyParameter({
  dbInstanceId: 'rm-bp1xxxx',
  parameters: [
    { name: 'max_connections', value: '2000' } // ❌ 未确认
  ]
});
```

**✅ 正确流程**:

```javascript
// 1. 先查询当前参数
const params = await rds.parameters.describeParameters(instanceId);
console.log('当前参数配置:');
params.data.Items?.DBParameter?.forEach(param => {
  console.log(`  - ${param.ParameterName}: ${param.ParameterValue} (默认：${param.ParameterDefault})`);
});

// 2. ⚠️ 询问用户要修改的参数
console.log('请输入要修改的参数名:');
const paramName = getUserInput();

console.log(`请输入新值 (当前值：${currentValue}, 默认值：${defaultValue}):`);
const paramValue = getUserInput();

// 3. 提醒用户是否需要重启
console.log('⚠️ 注意：部分参数修改后需要重启实例才能生效');
console.log('是否立即重启实例？(y/n)');
const forceRestart = getUserInput() === 'y' ? 'true' : 'false';

await rds.parameters.modifyParameter({
  dbInstanceId: instanceId,
  parameters: JSON.stringify({
    parameters: [
      { ParameterName: paramName, ParameterValue: paramValue } // ✅ 用户确认
    ]
  }),
  forceRestart: forceRestart
});
```

**必须确认的参数**:
| 参数 | 说明 | 示例 |
|------|------|------|
| 参数名 | 要修改的参数 | max_connections / wait_timeout 等 |
| 参数值 | 新值 | **必须由用户确认** |
| forceRestart | 是否重启 | true / false |

## 🔗 OpenAPI 调试

**RDS OpenAPI 调试页面**:
https://next.api.aliyun.com/api/Rds/2014-08-15/DescribeDBInstances?params={}

**使用说明**:
1. 在 OpenAPI 调试页面选择要调用的 API
2. 填入必要的参数（如 RegionId）
3. 点击"运行"查看返回结果和请求参数
4. 对比 Skill 调用时的参数，确认是否一致

**⚠️ 调用失败时**:
1. 检查返回的错误码和错误信息
2. 在 OpenAPI 调试页面使用相同参数重试
3. 对比参数名称、类型是否一致
4. 检查 RegionId、实例 ID 等必填参数是否正确
5. 查阅 [RDS API 文档](https://help.aliyun.com/zh/rds/developer-reference/api-overview)

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
  await rds.instances.createInstance(params); // ❌ 为什么要创建 5 个？
}

// ❌ 错误：并行创建，不等待结果
Promise.all([
  rds.instances.createInstance(params1),
  rds.instances.createInstance(params2),
  rds.instances.createInstance(params3)
]);

// ❌ 错误：一次性删除多个实例，不等待结果
const instanceIds = ['rm-xxx1', 'rm-xxx2', 'rm-xxx3', 'rm-xxx4', 'rm-xxx5'];
instanceIds.forEach(id => {
  rds.instances.deleteInstance(id); // ❌ 没有等待结果，无法确认是否成功
});
```

### ✅ 正确示例

**场景 1：用户要求创建 1 个实例**
```javascript
// ✅ 正确：只创建 1 个，等待结果
console.log('正在创建实例...');
const result = await rds.instances.createInstance(params);

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
  const result = await rds.instances.createInstance(params);
  
  if (result.success) {
    console.log(`✅ 第 ${i} 个实例创建成功：${result.data.DBInstanceId}`);
  } else {
    console.error(`❌ 第 ${i} 个实例创建失败：${result.error.message}`);
    // 失败时立即停止，询问用户是否继续
    const shouldContinue = getUserConfirmation(`已失败 ${i}/${count}，是否继续创建剩余 ${count - i} 个？`);
    if (!shouldContinue) {
      console.log('已停止批量创建');
      break;
    }
  }
}
console.log(`批量创建完成：成功 ${successCount}/${count} 个`);
```

**场景 3：批量删除**
```javascript
// ✅ 正确：批量删除前，先确认数量
const instancesToDelete = ['rm-xxx1', 'rm-xxx2', 'rm-xxx3'];
console.log(`⚠️ 即将删除 ${instancesToDelete.length} 个实例，请确认：`);
instancesToDelete.forEach(id => console.log(`  - ${id}`));
const confirmed = getUserConfirmation(); // 必须用户确认
if (!confirmed) {
  console.log('已取消操作');
  return;
}

// ✅ 正确：逐个删除，等待每个操作的结果
for (const instanceId of instancesToDelete) {
  console.log(`正在删除实例 ${instanceId}...`);
  const result = await rds.instances.deleteInstance(instanceId);
  
  if (result.success) {
    console.log(`✅ 实例 ${instanceId} 删除成功`);
  } else {
    console.error(`❌ 实例 ${instanceId} 删除失败：${result.error.message}`);
    // 询问用户是否继续
    const shouldContinue = getUserConfirmation('是否继续删除剩余实例？');
    if (!shouldContinue) {
      console.log('已停止批量操作');
      break;
    }
  }
}
```

### 批量操作检查清单

**执行前**:
- [ ] 明确告知用户要操作的数量（"即将删除 5 个实例"）
- [ ] 列出所有操作对象的 ID/名称
- [ ] 获得用户明确确认（不要默认继续）
- [ ] 提醒用户这是不可逆操作（删除时）

**执行中**:
- [ ] 逐个执行，不要并行
- [ ] 等待每个操作的结果返回
- [ ] 检查每个操作的成功/失败状态
- [ ] 失败时立即停止并询问用户

**执行后**:
- [ ] 汇总报告成功/失败数量
- [ ] 列出失败的操作及原因
- [ ] 建议后续处理方案

---

## 错误处理

```javascript
const result = await rds.instances.createInstance({...params});

if (result.success) {
  console.log('成功:', result.data);
} else {
  console.error('失败:', result.error.code, result.error.message);
  
  // 常见错误处理
  switch (result.error.code) {
    case 'InvalidPassword.Malformed':
      console.log('密码格式错误，需要 8-32 位，至少 3 种字符');
      break;
    case 'IncorrectDBInstanceState':
      console.log('实例状态不支持此操作，请等待实例变为 Running 状态');
      break;
    case 'OperationDenied.DeletionProtection':
      console.log('实例开启释放保护，请先关闭');
      break;
    case 'InvalidRegionId.NotFound':
      console.log('地域 ID 不存在，请检查 RegionId 参数');
      break;
  }
}
```

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|---------|
| InvalidDBInstanceId.NotFound | 实例不存在 | 检查实例 ID 是否正确 |
| IncorrectDBInstanceState | 实例状态不支持 | 等待实例变为 Running 状态 |
| InvalidPassword.Malformed | 密码格式错误 | 检查密码复杂度要求 |
| OperationDenied.DeletionProtection | 开启释放保护 | 先关闭释放保护 |
| InvalidRegionId.NotFound | 地域不存在 | 检查 RegionId 参数 |
| InvalidvSwitchId | 交换机不在指定可用区 | 不指定 VPC，让系统自动分配 |
| Zone.Closed | 该可用区已关闭或售罄 | 更换可用区或不指定 VPC |
| InvalidVPC.NotFound | VPC/交换机无效 | 不指定 VPC，让系统自动分配 |

## 使用示例

```javascript
const RDSDatabaseOperation = require('./rds-database-operation');

// 初始化（从环境变量读取 AKSK）
const rds = new RDSDatabaseOperation();

// 查询实例列表
const instances = await rds.instances.describeInstances({
  regionId: 'cn-hangzhou',
  pageNumber: 1,
  pageSize: 30
});

// 查询实例详情
const info = await rds.instances.describeInstanceAttribute('rm-bp1xxxx');

// 查询白名单
const whitelist = await rds.security.describeSecurityIps('rm-bp1xxxx');

// 查询参数
const params = await rds.parameters.describeParameters('rm-bp1xxxx');
```

## 版本

- API 版本：2014-08-15
- Skill 版本：1.1.0
- 签名机制：V1 (HMAC-SHA1)
- Endpoint: rds.aliyuncs.com

## 相关文档

- [阿里云 RDS 官方文档](https://help.aliyun.com/product/26090.html)
- [RDS API 参考](https://help.aliyun.com/zh/rds/developer-reference/api-overview)
- [OpenAPI 调试](https://next.api.aliyun.com/api/Rds/2014-08-15/DescribeDBInstances)
