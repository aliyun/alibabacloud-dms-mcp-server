# RDS 数据库操作 Skill - 增强版

阿里云 RDS 数据库管理工具，支持多账号凭证自动发现与选择。

## ✨ 新增功能

### 1. 多来源凭证自动发现

支持从以下 5 种来源自动发现阿里云 AKSK 凭证：

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1 | 直接配置 | 调用时传入 `accessKeyId` 和 `accessKeySecret` |
| 2 | OpenClaw 环境变量 | `ALIBABA_CLOUD_ACCESS_KEY_ID` 等 |
| 3 | 多AI工具环境变量 | 支持 QoderWork/OpenClaw/通用等多种命名 |
| 4 | aliyun-cli 配置 | `~/.aliyun/config.json`（支持多 profile） |
| 5 | 凭证文件 | `~/.alibabacloud/credentials`（INI 格式） |

### 2. 多 AI 工具环境变量兼容

支持以下环境变量命名规范（按优先级）：

| 优先级 | 命名规范 | 环境变量名 | 适用场景 |
|--------|----------|-----------|----------|
| 1 | QoderWork / 阿里云官方 | `ALIBABA_CLOUD_*` | QoderWork、阿里云官方 SDK |
| 2 | 阿里云简写 | `ALIBABA_*` | 简写形式 |
| 3 | 通用形式 | `ACCESS_KEY_*` | 通用命名、兼容其他工具 |
| 4 | 旧版 CLI | `ALIYUN_*` | 旧版 aliyun-cli |

### 2. 多账号支持

自动扫描所有可用凭证，支持：
- 自动选择最高优先级凭证
- 列出所有凭证让用户选择
- 通过 profile 名称指定使用哪个账号

### 3. 凭证来源透明

明确告知当前使用的凭证来源，避免误操作。

## 📦 安装

无需额外安装，凭证管理模块已集成到 skill 中。

## 🚀 使用示例

### 基础用法（自动选择凭证）

```javascript
const RDSDatabaseOperation = require('./rds-database-operation');

const rds = new RDSDatabaseOperation({
  autoSelect: true, // 自动选择最高优先级凭证
  regionId: 'cn-hangzhou'
});

// 查询当前凭证信息
const credInfo = await rds.getCredentialInfo();
console.log(`使用凭证：${credInfo.name} (${credInfo.source})`);

// 查询 RDS 实例列表
const instances = await rds.instances.describeInstances({
  pageNumber: 1,
  pageSize: 10
});
```

### 查看可用凭证列表

```javascript
const rds = new RDSDatabaseOperation();

// 发现所有凭证
const sources = await rds.discoverCredentials();

sources.forEach(cred => {
  console.log(`${cred.name} - ${cred.profile} (${cred.source})`);
});
```

### 指定使用特定凭证

```javascript
// 方式 1: 通过 profileName 指定
const rds = new RDSDatabaseOperation({
  profileName: 'OpenClaw 系统配置'
});

// 方式 2: 手动选择
const rds = new RDSDatabaseOperation();
await rds.selectCredential('aliyun-cli: production');
```

### 多账号环境下的选择流程

```javascript
const rds = new RDSDatabaseOperation({
  autoSelect: false, // 不自动选择
  requireConfirmation: true // 需要确认
});

try {
  await rds.getCredentialInfo();
} catch (error) {
  if (error.message.includes('发现多套阿里云凭证')) {
    console.log(error.message);
    // 输出所有可用凭证列表，让用户选择
  }
}
```

### 创建 RDS 实例

```javascript
const rds = new RDSDatabaseOperation({
  autoSelect: true,
  regionId: 'cn-hangzhou'
});

const result = await rds.instances.createInstance({
  engine: 'mysql',
  engineVersion: '8.0',
  dbInstanceClass: 'mysql.n2.medium.1', // 2 核 4GB
  dbInstanceStorage: 20, // 20GB
  payType: 'Postpaid', // 按量付费
  dbInstanceStorageType: 'cloud_essd',
  category: 'HighAvailability',
  zoneId: 'cn-hangzhou-i',
  vpcId: 'vpc-xxx', // 可选
  vSwitchId: 'vsw-xxx', // 可选
  description: '生产数据库',
  clientToken: `create-${Date.now()}` // 幂等令牌
});

console.log(`实例创建成功：${result.DBInstanceId}`);
```

### 查询 VPC 和交换机

```javascript
// 查询 VPC 列表
const vpcs = await rds.network.describeVpcs({
  regionId: 'cn-hangzhou'
});

// 查询指定 VPC 下的交换机
const vswitches = await rds.network.describeVSwitches({
  regionId: 'cn-hangzhou',
  vpcId: 'vpc-xxx',
  zoneId: 'cn-hangzhou-i'
});
```

## 🔧 配置方式

### 方式 1: 环境变量（推荐）

支持多种命名规范，任选其一即可：

```bash
# QoderWork / 阿里云官方推荐（优先级最高）
export ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id
export ALIBABA_CLOUD_ACCESS_KEY_SECRET=...
export ALIBABA_CLOUD_REGION_ID=cn-hangzhou

# 阿里云简写形式
export ALIBABA_ACCESS_KEY_ID=your_access_key_id
export ALIBABA_ACCESS_KEY_SECRET=...

# 通用形式（兼容其他 AI 工具）
export ACCESS_KEY_ID=your_access_key_id
export ACCESS_KEY_SECRET=...
```

### 方式 2: 配置优先级

当多种配置同时存在时，按以下优先级使用：

```
1. 直接传入 config（最高优先级）
   ↓
2. OpenClaw 系统环境变量
   ↓
3. QoderWork / 阿里云官方环境变量 (ALIBABA_CLOUD_*)
   ↓
4. 阿里云简写环境变量 (ALIBABA_*)
   ↓
5. 通用环境变量 (ACCESS_KEY_*)
   ↓
6. aliyun-cli 配置文件
   ↓
7. 凭证文件（最低优先级）
```

### 方式 3: aliyun-cli 配置

```bash
aliyun configure
# 按提示输入 AKSK 和地域
```

配置文件位置：`~/.aliyun/config.json`

### 方式 4: 凭证文件

创建 `~/.alibabacloud/credentials`：

```ini
[default]
access_key_id = your_access_key_id
access_key_secret = ...
region_id = cn-hangzhou

[production]
access_key_id = your_access_key_id
access_key_secret = ...
region_id = cn-shanghai
```

### 方式 5: 直接传入配置

```javascript
const rds = new RDSDatabaseOperation({
  accessKeyId: 'your_access_key_id',
  accessKeySecret: '...',
  regionId: 'cn-hangzhou',
  profileName: 'my-account'
});
```

## 📝 可用 API

### 实例管理
- `describeInstances(params)` - 查询实例列表
- `describeInstanceAttribute(dbInstanceId)` - 查询实例详情
- `createInstance(params)` - 创建实例
- `deleteInstance(dbInstanceId)` - 删除实例
- `restartInstance(dbInstanceId)` - 重启实例
- `startInstance(dbInstanceId)` - 启动实例
- `stopInstance(dbInstanceId)` - 停止实例
- `modifyInstanceSpec(dbInstanceId, spec, storage)` - 变更配置
- `modifyInstanceDescription(dbInstanceId, description)` - 修改描述

### 账号管理
- `createAccount(params)` - 创建账号
- `deleteAccount(dbInstanceId, accountName)` - 删除账号
- `describeAccounts(params)` - 查询账号列表
- `resetAccountPassword(params)` - 重置密码
- `grantAccountPrivilege(params)` - 授权数据库
- `modifyAccountDescription(dbInstanceId, accountName, description)` - 修改描述

### 数据库管理
- `createDatabase(params)` - 创建数据库
- `deleteDatabase(params)` - 删除数据库
- `describeDatabases(params)` - 查询数据库列表
- `modifyDatabaseDescription(dbInstanceId, dbName, description)` - 修改描述

### 白名单管理
- `modifySecurityIps(dbInstanceId, securityIps, securityIpGroupName)` - 修改白名单
- `describeSecurityIps(dbInstanceId, securityIpGroupName)` - 查询白名单

### 网络管理
- `allocatePublicConnection(dbInstanceId, connectionStringPrefix, port)` - 申请公网地址
- `releasePublicConnection(dbInstanceId, currentConnectionString)` - 释放公网地址
- `describeNetInfo(dbInstanceId)` - 查询网络信息
- `switchNetworkType(dbInstanceId, networkType)` - 切换网络类型
- `switchVPC(dbInstanceId, vpcId, vSwitchId)` - 切换 VPC
- `describeVpcs(regionId, vpcId)` - 查询 VPC 列表
- `describeVSwitches(regionId, vpcId, zoneId)` - 查询交换机列表

### 备份管理
- `createBackup(params)` - 创建备份
- `deleteBackup(dbInstanceId, backupId)` - 删除备份
- `describeBackups(params)` - 查询备份列表

### 参数管理
- `describeParameters(dbInstanceId, params)` - 查询参数列表
- `modifyParameters(params)` - 修改参数
- `describeParameterGroupDetail(parameterGroupId)` - 查询参数模板详情

## 🧪 测试

### 测试凭证发现

```bash
cd /home/admin/.openclaw/workspace/skills/rds-database-operation
node test-credential.js
```

### 测试实例创建

```bash
node test-create-instance.js
```

## ⚠️ 注意事项

1. **凭证安全**: 不要在代码中硬编码 AKSK，使用环境变量或配置文件
2. **多账号**: 发现多个凭证时，明确指定使用哪个，避免误操作
3. **按量付费**: 创建实例前确认账户余额，测试后及时删除
4. **幂等性**: 创建操作使用 `clientToken` 避免重复创建
5. **地域**: 确保凭证的地域与操作的地域一致
6. **STS 临时凭证**: 如需使用 STS，请额外设置 `ALIBABA_CLOUD_SECURITY_TOKEN`

## 🔌 兼容性

### 支持的 AI 工具

- ✅ **OpenClaw** - 系统环境变量
- ✅ **QoderWork** - 阿里云官方环境变量
- ✅ **其他 AI 工具** - 通用环境变量命名
- ✅ **本地开发** - aliyun-cli / 凭证文件

### 支持的产品

- ✅ RDS (MySQL/PostgreSQL/SQL Server)
- ✅ PolarDB
- ✅ Redis (Tair)
- ✅ MongoDB
- ✅ VPC 网络

## 📄 许可证

MIT
