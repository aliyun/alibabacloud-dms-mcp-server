# PolarDB 数据库操作 Skill

## 描述

阿里云 PolarDB 云原生数据库管理技能，使用 **V1 签名机制 (HMAC-SHA1)**，提供集群管理、账号管理、数据库管理、白名单管理、备份管理、访问地址管理、连接诊断、参数管理等 8 大章节的 API 能力。

## 签名机制

**签名版本**: V1 (HMAC-SHA1)

**API 版本**: 2017-08-01

**Endpoint**: `polardb.aliyuncs.com`

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

### 1. 集群管理 (clusters)
- `createCluster()` - 创建集群
- `deleteCluster()` - 删除集群
- `describeClusters()` - 查询集群列表
- `describeClusterAttribute()` - 查询集群详情
- `modifyClusterDescription()` - 修改集群描述

### 2. 账号管理 (accounts)
- `createAccount()` - 创建账号
- `deleteAccount()` - 删除账号
- `describeAccounts()` - 查询账号列表
- `modifyAccountPassword()` - 修改密码
- `grantAccountPrivilege()` - 授权

### 3. 数据库管理 (databases)
- `createDatabase()` - 创建数据库
- `deleteDatabase()` - 删除数据库
- `describeDatabases()` - 查询数据库列表
- `modifyDatabaseDescription()` - 修改描述

### 4. 白名单管理 (whitelist)
- `describeWhitelist()` - 查询白名单
- `modifyWhitelist()` - 修改白名单

### 5. 备份管理 (backup)
- `createBackup()` - 创建备份
- `deleteBackup()` - 删除备份
- `describeBackups()` - 查询备份列表
- `describeBackupPolicy()` - 查询备份策略

### 6. 访问地址管理 (endpoints)
- `describeEndpoints()` - 查询访问地址
- `createPublicConnection()` - 创建公网地址
- `deletePublicConnection()` - 删除公网地址

### 7. 连接诊断 (connection)
- `describeClusterConnectivity()` - 连接性测试
- `describeClusterSSL()` - 查询 SSL
- `modifyClusterSSL()` - 修改 SSL

### 8. 参数管理 (parameters)
- `describeDBClusterConfig()` - 查询集群参数
- `modifyDBClusterConfig()` - 修改集群参数
- `describeParameterGroups()` - 查询参数模板
- `createParameterGroup()` - 创建参数模板
- `modifyParameterGroup()` - 修改参数模板
- `deleteParameterGroup()` - 删除参数模板
- `applyParameterGroup()` - 应用参数模板

## ⚠️ 关键参数确认流程

### 创建集群 - 必须询问用户

**❌ 错误示例**:
```javascript
// 不要使用默认值！
await polardb.clusters.createCluster({
  dbType: 'MySQL', // ❌ 未确认
  dbVersion: '8.0', // ❌ 未确认
  password: 'DefaultPass123' // ❌ 严禁默认密码
});
```

**✅ 正确流程**:

```javascript
// 1. 询问数据库类型
console.log('请选择数据库类型：');
console.log('  1. MySQL');
console.log('  2. PostgreSQL');
console.log('  3. Oracle');
const dbType = getUserInput();

// 2. 询问数据库版本
console.log('请选择数据库版本：');
const dbVersion = getUserInput();

// 3. 先查询可用规格（重要！不同可用区支持的规格不同）
const resources = await polardb.clusters.describeDBClusterAvailableResources({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h'
});
console.log('可用规格：', resources);
const dbNodeClass = getUserInput(); // 从查询结果中选择

// 4. 询问节点数量
console.log('请选择节点数量：');
const dbNodes = getUserInput();

// 5. 询问付费类型
console.log('请选择付费类型：');
console.log('  1. Postpaid (按量付费)');
console.log('  2. Prepaid (包年包月)');
const payType = getUserChoice(['Postpaid', 'Prepaid']);

// 6. ⚠️ 密码必须由用户提供
console.log('请设置集群密码 (8-32 位，至少 3 种字符):');
const password = getUserPassword();

// 7. 网络配置（推荐不指定，让系统自动分配）
console.log('请选择网络配置方式：');
console.log('  1. 自动分配 VPC（推荐）');
console.log('  2. 手动指定 VPC');
const networkChoice = getUserInput();

let vpcId, vSwitchId;
if (networkChoice === '2') {
  console.log('请选择 VPC ID:');
  vpcId = getUserInput();
  console.log('请选择交换机 ID:');
  vSwitchId = getUserInput();
  console.log('⚠️ 注意：请确保 VPC 和交换机在指定的可用区中');
}

// 8. 确认后创建
const createParams = {
  dbType: dbType,
  dbVersion: dbVersion,
  dbNodeClass: dbNodeClass,
  dbNodes: dbNodes,
  payType: payType,
  dbClusterDescription: userProvidedName,
  password: password // ✅ 用户提供
};

// 只有用户选择手动指定 VPC 时才添加
if (vpcId) {
  createParams.vpcId = vpcId;
  createParams.vSwitchId = vSwitchId;
}

await polardb.clusters.createCluster(createParams);
```

**必须确认的参数**:
| 参数 | 说明 | 示例 |
|------|------|------|
| dbType | 数据库类型 | MySQL / PostgreSQL / Oracle |
| dbVersion | 数据库版本 | 8.0 / 11.0 等 |
| dbNodeClass | 节点规格 | polar.mysql.x4.medium 等 |
| dbNodes | 节点数量 | 2-16 |
| payType | 付费类型 | Postpaid / Prepaid |
| password | 密码 | **必须由用户提供** |
| vpcId/vSwitchId | 网络配置 | 可选，建议让系统自动分配 |

### VPC 网络配置最佳实践

**⚠️ 重要提示**：

1. **推荐做法**：不指定 `vpcId` 和 `vSwitchId`，让系统自动分配
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
| COMMODITY.INVALID_COMPONENT | Invalid commodity component | 规格与可用区不匹配 | 先查询可用规格再创建 |

**示例代码**：
```javascript
// ✅ 推荐：不指定 VPC，让系统自动分配
await polardb.clusters.createCluster({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h',
  dbType: 'MySQL',
  dbVersion: '8.0',
  dbNodeClass: 'polar.mysql.x4.medium',
  dbNodeNum: '2',
  payType: 'Postpaid',
  dbClusterDescription: 'test-cluster',
  password: 'YourPassword123'
  // 不指定 vpcId 和 vSwitchId
});

// ⚠️ 手动指定（需要确保 VPC/交换机在目标可用区）
await polardb.clusters.createCluster({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h',
  dbType: 'MySQL',
  dbVersion: '8.0',
  dbNodeClass: 'polar.mysql.x4.medium',
  dbNodeNum: '2',
  payType: 'Postpaid',
  dbClusterDescription: 'test-cluster',
  password: 'YourPassword123',
  vpcId: 'vpc-xxx',        // 必须在 cn-hangzhou-h
  vSwitchId: 'vsw-xxx'     // 必须在 cn-hangzhou-h
});
```

### 创建账号 - 必须询问用户

**❌ 错误示例**:
```javascript
// 不要这样做！
await polardb.accounts.createAccount({
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

await polardb.accounts.createAccount({
  dbClusterId: clusterId,
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
await polardb.whitelist.modifyWhitelist({
  dbClusterId: 'pc-bp1xxxx',
  securityIps: '192.168.1.1,10.0.0.0/24' // ❌ 未确认
});
```

**✅ 正确流程**:

```javascript
// 1. 先查询当前白名单
const currentWhitelist = await polardb.whitelist.describeWhitelist(clusterId);
console.log('当前白名单:');
// 展示当前白名单

// 2. ⚠️ 询问用户要添加的 IP
console.log('请输入要添加到白名单的 IP 地址 (逗号分隔):');
console.log('示例：192.168.1.100,10.0.0.0/24');
console.log('⚠️ 注意：0.0.0.0/0 表示允许所有 IP，仅限测试使用！');
const securityIps = getUserInput(); // 必须用户输入

// 3. 确认后修改
await polardb.whitelist.modifyWhitelist({
  dbClusterId: clusterId,
  securityIps: securityIps // ✅ 用户提供
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
const params = await polardb.parameters.describeDBClusterConfig(clusterId);
console.log('当前参数配置:');
// 展示参数列表

// 2. ⚠️ 询问用户要修改的参数
console.log('请输入要修改的参数名:');
const paramName = getUserInput();

console.log('请输入新值:');
const paramValue = getUserInput();

await polardb.parameters.modifyDBClusterConfig({
  dbClusterId: clusterId,
  parameters: JSON.stringify({
    parameters: [
      { ParameterName: paramName, ParameterValue: paramValue } // ✅ 用户确认
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

**PolarDB OpenAPI 调试页面**:
https://next.api.aliyun.com/api/polardb/2017-08-01/DescribeDBClusters?params={}

**使用说明**:
1. 在 OpenAPI 调试页面选择要调用的 API
2. 填入必要的参数（如 RegionId）
3. 点击"运行"查看返回结果和请求参数
4. 对比 Skill 调用时的参数，确认是否一致

**⚠️ 重要提示**:
- **DescribeDBClusters 接口只传 RegionId 参数，不要传 PageNumber/PageSize**
- 某些 API 在有分页参数时可能返回空结果

**调用失败时**:
1. 检查返回的错误码和错误信息
2. 在 OpenAPI 调试页面使用相同参数重试
3. 对比参数名称、类型是否一致
4. 检查 RegionId、集群 ID 等必填参数是否正确
5. 查阅 [PolarDB API 文档](https://help.aliyun.com/zh/polardb/developer-reference/api-overview-1)

## ⚠️ 批量操作安全规范

### 🔴 核心原则

**严格按用户要求执行，不要自己乱试！**

1. **用户说创建 1 个，就创建 1 个** —— 不要自己循环创建多个
2. **用户说创建 3 个，就创建 3 个** —— 不要多也不要少
3. **每次操作后等待结果** —— 确认成功后再决定下一步
4. **失败时立即停止** —— 不要继续执行，先问用户

### ❌ 错误示例 (不要这样做！)

```javascript
// ❌ 错误：用户没要求，自己循环创建多个集群
for (let i = 0; i < 5; i++) {
  await polardb.clusters.createCluster(params); // ❌ 为什么要创建 5 个？
}

// ❌ 错误：并行创建，不等待结果
Promise.all([
  polardb.clusters.createCluster(params1),
  polardb.clusters.createCluster(params2)
]);

// ❌ 错误：一次性删除多个集群，不等待结果
const clusterIds = ['pc-xxx1', 'pc-xxx2', 'pc-xxx3'];
clusterIds.forEach(id => {
  polardb.clusters.deleteCluster(id); // ❌ 没有等待结果
});
```

### ✅ 正确示例

**场景 1：用户要求创建 1 个集群**
```javascript
// ✅ 正确：只创建 1 个，等待结果
console.log('正在创建集群...');
const result = await polardb.clusters.createCluster(params);

if (result.success) {
  console.log(`✅ 集群创建成功：${result.data.DBClusterId}`);
  // 任务完成，不要继续创建
} else {
  console.error(`❌ 集群创建失败：${result.error.message}`);
  // 失败时停止，询问用户
}
```

**场景 2：用户明确要求创建多个集群**
```javascript
// ✅ 正确：用户要求创建 3 个，逐个执行并确认
const count = 3; // 用户明确要求的数量
for (let i = 1; i <= count; i++) {
  console.log(`正在创建第 ${i}/${count} 个集群...`);
  const result = await polardb.clusters.createCluster(params);
  
  if (result.success) {
    console.log(`✅ 第 ${i} 个集群创建成功：${result.data.DBClusterId}`);
  } else {
    console.error(`❌ 第 ${i} 个集群创建失败：${result.error.message}`);
    const shouldContinue = getUserConfirmation(`已失败 ${i}/${count}，是否继续？`);
    if (!shouldContinue) break;
  }
}
```

**场景 3：批量删除**
```javascript
// ✅ 正确：批量删除前，先确认数量
const clustersToDelete = ['pc-xxx1', 'pc-xxx2', 'pc-xxx3'];
console.log(`⚠️ 即将删除 ${clustersToDelete.length} 个集群，请确认：`);
clustersToDelete.forEach(id => console.log(`  - ${id}`));
const confirmed = getUserConfirmation();
if (!confirmed) {
  console.log('已取消操作');
  return;
}

// ✅ 正确：逐个删除，等待每个操作的结果
for (const clusterId of clustersToDelete) {
  const result = await polardb.clusters.deleteCluster(clusterId);
  if (result.success) {
    console.log(`✅ 集群 ${clusterId} 删除成功`);
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
const result = await polardb.clusters.createCluster({...params});

if (result.success) {
  console.log('成功:', result.data);
} else {
  console.error('失败:', result.error.code, result.error.message);
  
  // 常见错误处理
  switch (result.error.code) {
    case 'InvalidPassword.Malformed':
      console.log('密码格式错误，需要 8-32 位，至少 3 种字符');
      break;
    case 'IncorrectDBClusterStatus':
      console.log('集群状态不支持此操作，请等待集群变为 Running 状态');
      break;
    case 'OperationDenied.DeletionProtection':
      console.log('集群开启释放保护，请先关闭');
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
| InvalidDBClusterId.NotFound | 集群不存在 | 检查集群 ID 是否正确 |
| IncorrectDBClusterStatus | 集群状态不支持 | 等待集群变为 Running 状态 |
| InvalidPassword.Malformed | 密码格式错误 | 检查密码复杂度要求 |
| OperationDenied.DeletionProtection | 开启释放保护 | 先关闭释放保护 |
| InvalidRegionId.NotFound | 地域不存在 | 检查 RegionId 参数 |
| InvalidvSwitchId | 交换机不在指定可用区 | 不指定 VPC，让系统自动分配 |
| Zone.Closed | 该可用区已关闭或售罄 | 更换可用区或不指定 VPC |
| InvalidVPC.NotFound | VPC/交换机无效 | 不指定 VPC，让系统自动分配 |
| COMMODITY.INVALID_COMPONENT | 规格与可用区不匹配 | 先查询可用规格再创建 |

## 使用示例

```javascript
const PolarDBDatabaseOperation = require('./polardb-database-operation');

// 初始化（从环境变量读取 AKSK）
const polardb = new PolarDBDatabaseOperation();

// 查询集群列表（⚠️ 只传 regionId，不传分页参数）
const clusters = await polardb.clusters.describeClusters({
  regionId: 'cn-hangzhou'
});

// 查询集群详情
const info = await polardb.clusters.describeClusterAttribute('pc-bp1xxxx');

// 查询白名单
const whitelist = await polardb.whitelist.describeWhitelist('pc-bp1xxxx');

// 查询参数
const params = await polardb.parameters.describeDBClusterConfig('pc-bp1xxxx');
```

## 版本

- API 版本：2017-08-01
- Skill 版本：1.1.0
- 签名机制：V1 (HMAC-SHA1)
- Endpoint: polardb.aliyuncs.com

## 相关文档

- [阿里云 PolarDB 官方文档](https://help.aliyun.com/product/54718.html)
- [PolarDB API 参考](https://help.aliyun.com/zh/polardb/developer-reference/api-overview-1)
- [OpenAPI 调试](https://next.api.aliyun.com/api/polardb/2017-08-01/DescribeDBClusters)
