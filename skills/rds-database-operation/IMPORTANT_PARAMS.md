# RDS 数据库操作 Skill - 关键参数说明

## 📋 关键参数清单

在使用本 Skill 创建资源时，以下关键参数**必须明确确认**，不能随意使用默认值：

---

## 1️⃣ 创建数据库账号 (CreateAccount)

### 关键参数

| 参数 | 说明 | 可选值 | 默认值 | 是否必须确认 |
|------|------|--------|--------|-------------|
| **accountType** | 账号类型 | `Normal`（普通账号）<br>`Super`（高权限账号） | Normal | ✅ **必须确认** |
| **accountPassword** | 密码 | 8-32 位，包含大写字母、小写字母、数字、特殊字符中的至少三种 | - | ✅ **必须用户提供** |
| accountName | 账号名称 | 由字母、数字、下划线组成，以字母开头 | - | ✅ 用户指定 |
| accountDescription | 账号描述 | 任意字符串 | 空 | ⚠️ 建议确认 |

### 账号类型说明

**Normal（普通账号）**：
- 只能管理普通数据库
- 无法执行高危操作（如删除数据库、修改实例参数等）
- 适用于业务应用
- **推荐使用**

**Super（高权限账号）**：
- 拥有最高权限，可以执行几乎所有操作
- 可以创建/删除数据库
- 可以修改实例参数
- 适用于 DBA 管理
- **谨慎使用**

### 正确的使用方式

```javascript
// ❌ 错误：不询问账号类型，直接使用默认值
await rds.accounts.createAccount({
  dbInstanceId: 'rm-xxxx',
  accountName: 'myuser',
  accountPassword: 'MyPass123'
  // accountType 未指定，默认 Normal
});

// ✅ 正确：先询问账号类型
console.log('请问您需要创建什么类型的账号？');
console.log('1. Normal - 普通账号（推荐，用于业务应用）');
console.log('2. Super - 高权限账号（谨慎使用，用于 DBA 管理）');
const accountType = getUserInput(); // 获取用户选择

await rds.accounts.createAccount({
  dbInstanceId: 'rm-xxxx',
  accountName: 'myuser',
  accountPassword: userProvidedPassword, // 用户提供
  accountType: accountType // 用户选择
});
```

---

## 2️⃣ 创建数据库 (CreateDatabase)

### 关键参数

| 参数 | 说明 | 可选值 | 默认值 | 是否必须确认 |
|------|------|--------|--------|-------------|
| **characterSetName** | 字符集 | `utf8`<br>`utf8mb4`<br>`gbk`<br>`gb18030`<br>`latin1` 等 | utf8 | ✅ **必须确认** |
| dbName | 数据库名称 | 由字母、数字、下划线组成，以字母开头 | - | ✅ 用户指定 |
| accountName | 所有者账号 | 已存在的账号名称 | - | ✅ 用户指定 |
| accountPrivilege | 账号权限 | `ReadWrite`<br>`ReadOnly`<br>`DDLOnly`<br>`DMLOnly` | ReadWrite | ✅ 建议确认 |

### 字符集说明

**utf8**：
- MySQL 的 utf8 是 3 字节编码
- 不支持 emoji 等特殊字符
- 兼容性最好
- 适用于纯中文、英文场景

**utf8mb4**（推荐）：
- 4 字节编码
- 支持 emoji、生僻字等所有 Unicode 字符
- MySQL 5.5+ 支持
- **推荐使用**

**gbk/gb18030**：
- 中文字符集
- 兼容 GB2312
- 适用于只包含中文的场景

**latin1**：
- 单字节编码
- 仅支持西欧语言
- 不适用于中文

### 正确的使用方式

```javascript
// ❌ 错误：不询问字符集，直接使用默认值
await rds.databases.createDatabase({
  dbInstanceId: 'rm-xxxx',
  dbName: 'mydb',
  characterSetName: 'utf8' // 默认值，可能不支持 emoji
});

// ✅ 正确：先询问字符集
console.log('请问您需要使用什么字符集？');
console.log('1. utf8mb4 - 支持所有字符，包括 emoji（推荐）');
console.log('2. utf8 - 基本字符集，不支持 emoji');
console.log('3. gbk - 中文字符集');
const charset = getUserInput();

await rds.databases.createDatabase({
  dbInstanceId: 'rm-xxxx',
  dbName: userProvidedDbName,
  characterSetName: charset, // 用户选择
  accountName: ownerAccount,
  accountPrivilege: 'ReadWrite'
});
```

---

## 3️⃣ 创建实例 (CreateDBInstance)

### 关键参数

| 参数 | 说明 | 可选值 | 默认值 | 是否必须确认 |
|------|------|--------|--------|-------------|
| **engine** | 数据库引擎 | `MySQL`<br>`PostgreSQL`<br>`SQLServer`<br>`MariaDB` | - | ✅ **必须确认** |
| **engineVersion** | 引擎版本 | 根据 engine 不同而不同 | - | ✅ **必须确认** |
| **dbInstanceClass** | 实例规格 | 根据引擎和地域不同而不同 | - | ✅ **必须确认** |
| **payType** | 付费类型 | `Postpaid`（按量付费）<br>`Prepaid`（包年包月） | Postpaid | ✅ **必须确认** |
| dbInstanceStorage | 存储空间 | 20-64000 GB | 20 | ✅ 用户指定 |
| category | 实例系列 | `Basic`（基础版）<br>`HighAvailability`（高可用版）<br>`Finance`（三节点企业版） | HighAvailability | ✅ 建议确认 |

### 正确的使用方式

```javascript
// ❌ 错误：不询问关键参数
await rds.instances.createInstance({
  engine: 'MySQL', // 默认
  engineVersion: '8.0', // 默认
  dbInstanceClass: 'mysql.n2.medium.2c', // 默认
  payType: 'Postpaid' // 默认
});

// ✅ 正确：逐一确认关键参数
console.log('请选择数据库引擎：');
console.log('1. MySQL');
console.log('2. PostgreSQL');
console.log('3. SQL Server');
const engine = getUserInput();

console.log('请选择版本：');
const versions = await getAvailableVersions(engine);
const version = getUserChoice(versions);

console.log('请选择实例规格：');
const specs = await getAvailableSpecs(engine, region);
const spec = getUserChoice(specs);

console.log('请选择付费类型：');
console.log('1. Postpaid - 按量付费（灵活，单价高）');
console.log('2. Prepaid - 包年包月（优惠，需长期）');
const payType = getUserInput();

await rds.instances.createInstance({
  engine: engine,
  engineVersion: version,
  dbInstanceClass: spec,
  payType: payType,
  dbInstanceStorage: userStorage
});
```

---

## 4️⃣ 安全配置 (ModifySecurityIps)

### 关键参数

| 参数 | 说明 | 可选值 | 默认值 | 是否必须确认 |
|------|------|--------|--------|-------------|
| **securityIps** | IP 白名单 | IP 地址或 CIDR 段 | - | ✅ **必须确认** |
| modifyMode | 修改模式 | `Cover`（覆盖）<br>`Append`（追加）<br>`Delete`（删除） | Cover | ✅ 建议确认 |

### 安全提醒

**0.0.0.0/0**：
- 允许所有 IP 访问
- **仅用于测试**
- 生产环境严禁使用

**正确的白名单配置**：
- 只添加应用服务器 IP
- 使用 CIDR 段限制范围
- 定期审查和清理

---

## 5️⃣ 网络配置 (AllocateInstancePublicConnection)

### 关键参数

| 参数 | 说明 | 可选值 | 默认值 | 是否必须确认 |
|------|------|--------|--------|-------------|
| connectionStringPrefix | 外网地址前缀 | 自定义前缀 | - | ✅ 用户指定 |
| port | 端口 | 1000-65534 | 3306 | ⚠️ 建议确认 |

### 安全提醒

**外网地址风险**：
- 允许从互联网访问数据库
- 必须配合白名单使用
- 测试完成后建议释放

---

## 📝 Skill 使用规范

### 1. 必须询问用户的参数

以下参数**必须**在调用 API 前询问用户：

```javascript
// 创建账号
- accountType（账号类型）
- accountPassword（密码，由用户提供）

// 创建数据库
- characterSetName（字符集）

// 创建实例
- engine（引擎类型）
- engineVersion（版本）
- dbInstanceClass（规格）
- payType（付费类型）
```

### 2. 可以有默认值但需告知用户的参数

```javascript
// 创建数据库
- accountPrivilege（默认 ReadWrite，但需告知）

// 创建实例
- category（默认 HighAvailability，但需告知）
- dbInstanceStorage（默认 20GB，但需告知）
```

### 3. 安全相关参数必须警示

```javascript
// 白名单配置
if (securityIps.includes('0.0.0.0/0')) {
  console.warn('⚠️ 警告：0.0.0.0/0 允许所有 IP 访问，仅用于测试！');
  const confirm = getUserConfirm();
  if (!confirm) throw new Error('用户取消操作');
}

// 外网地址
if (action === 'allocatePublicConnection') {
  console.warn('⚠️ 警告：外网地址允许从互联网访问数据库！');
  console.warn('建议测试完成后立即释放');
  const confirm = getUserConfirm();
  if (!confirm) throw new Error('用户取消操作');
}
```

---

## 🎯 最佳实践

### 1. 参数确认流程

```javascript
async function createAccountWithConfirmation(params) {
  // 1. 确认账号类型
  if (!params.accountType) {
    console.log('请选择账号类型：');
    console.log('1. Normal - 普通账号（推荐）');
    console.log('2. Super - 高权限账号（谨慎使用）');
    params.accountType = getUserInput() === '1' ? 'Normal' : 'Super';
  }
  
  // 2. 确认密码
  if (!params.accountPassword) {
    console.log('请输入密码（8-32 位，包含大小写字母、数字、特殊字符中的至少三种）：');
    params.accountPassword = getUserPassword();
  }
  
  // 3. 确认其他参数
  // ...
  
  // 4. 执行创建
  return await rds.accounts.createAccount(params);
}
```

### 2. 参数验证

```javascript
function validateAccountPassword(password) {
  if (password.length < 8 || password.length > 32) {
    throw new Error('密码长度必须在 8-32 位之间');
  }
  
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=]/.test(password);
  
  const count = [hasUpper, hasLower, hasDigit, hasSpecial].filter(v => v).length;
  if (count < 3) {
    throw new Error('密码必须包含大写字母、小写字母、数字、特殊字符中的至少三种');
  }
  
  return true;
}
```

---

## 📖 文档更新清单

- [x] SKILL.md - 添加关键参数说明
- [x] README.md - 添加参数确认流程
- [x] API_REFERENCE.md - 完善参数说明
- [x] examples.js - 添加参数确认示例

---

**更新时间**: 2026-04-01  
**版本**: 1.1.0
