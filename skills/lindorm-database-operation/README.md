# Lindorm 数据库操作 Skill

**版本**: 1.0.0  
**最后更新**: 2026-04-03

## 描述

阿里云 Lindorm (原 HitsDB) 数据库管理技能，使用 **V1 签名机制 (HMAC-SHA1)**，提供实例管理、白名单管理、标签管理、地域管理等 API 能力。

## 签名机制

**签名版本**: V1 (HMAC-SHA1)

**API 版本**: 2020-06-15

**Endpoint**: `hitsdb.aliyuncs.com`

## 环境变量

支持多种环境变量命名（兼容 QoderWork、OpenClaw、其他 AI 工具）：

```bash
# QoderWork / 阿里云官方推荐（优先级最高）
export ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id
export ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret
export ALIBABA_CLOUD_REGION_ID=cn-hangzhou

# 阿里云简写形式
export ALIBABA_ACCESS_KEY_ID=your_access_key_id
export ALIBABA_ACCESS_KEY_SECRET=your_access_key_secret

# 通用形式
export ACCESS_KEY_ID=your_access_key_id
export ACCESS_KEY_SECRET=your_access_key_secret
```

**⚠️ 安全提醒**: 
- 不要在代码中硬编码 AKSK
- 使用环境变量或配置对象传入
- 建议使用 RAM 子账号，遵循最小权限原则

## 功能模块

### 1. 实例管理 (instances)
- `createInstance()` - 创建 Lindorm 实例
- `createV2Instance()` - 创建 Lindorm V2 实例（新架构）
- `releaseInstance()` - 释放 Lindorm 实例
- `releaseV2Instance()` - 释放 Lindorm V2 实例
- `describeInstances()` - 获取实例列表
- `describeInstance()` - 获取实例详情
- `describeV2Instance()` - 获取 V2 实例详情
- `upgradeInstance()` - 变配实例
- `updateV2Instance()` - 更新 V2 实例
- `renewInstance()` - 续费实例
- `modifyPayType()` - 变更计费方式
- `updateInstanceAttribute()` - 更新实例属性
- `describeStorageDetail()` - 获取存储详情
- `describeEngineList()` - 获取支持的引擎类型
- `switchLSQLV3MySQLService()` - 开通 MySQL 协议

### 2. 白名单管理 (whitelist)
- `updateWhitelist()` - 设置白名单
- `updateV2Whitelist()` - 设置 V2 白名单
- `describeWhitelist()` - 获取白名单

### 3. 标签管理 (tags)
- `tagResources()` - 绑定标签
- `untagResources()` - 解绑标签
- `listTagResources()` - 查询标签绑定

### 4. 地域管理 (regions)
- `describeRegions()` - 获取支持的地域

### 5. 资源组管理 (resourceGroups)
- `changeResourceGroup()` - 资源转组

## 使用示例

### 基础用法

```javascript
const LindormDatabaseOperation = require('./lindorm-database-operation');

// 自动选择凭证
const lindorm = new LindormDatabaseOperation({
  autoSelect: true,
  regionId: 'cn-hangzhou'
});

// 查询当前凭证
const cred = await lindorm.getCredentialInfo();
console.log(`使用凭证：${cred.name}`);

// 查询实例列表
const instances = await lindorm.instances.describeInstances();
console.log(instances);
```

### 创建 Lindorm 实例

```javascript
// 创建 Lindorm 实例
const result = await lindorm.instances.createInstance({
  zoneId: 'cn-hangzhou-i',
  vpcId: 'vpc-xxx',
  vSwitchId: 'vsw-xxx',
  lindormType: 'lindorm',
  coreSpec: 'lindorm.c.2xlarge',
  coreNumber: 2,
  storageNumber: 2,
  payType: 'Postpaid',
  instanceName: 'my-lindorm-instance',
  description: '测试实例'
});

console.log(`实例创建成功：${result.InstanceId}`);
```

### 创建 Lindorm V2 实例（新架构）

```javascript
const result = await lindorm.instances.createV2Instance({
  zoneId: 'cn-hangzhou-i',
  vpcId: 'vpc-xxx',
  vSwitchId: 'vsw-xxx',
  seriesCode: 'lindorm_v2',
  coreSpec: 'lindorm.c.2xlarge',
  coreDiskSize: 100,
  coreNumber: 2,
  payType: 'Postpaid',
  instanceName: 'my-lindorm-v2-instance'
});

console.log(`V2 实例创建成功：${result.InstanceId}`);
```

### 设置白名单

```javascript
// ⚠️ 安全提醒：不要使用 0.0.0.0/0
await lindorm.whitelist.updateWhitelist({
  instanceId: 'lindorm-xxx',
  ipList: '192.168.1.0/24,10.0.0.0/8'
});
```

### 查询地域列表

```javascript
const regions = await lindorm.regions.describeRegions();
console.log('支持的地域:', regions);
```

## 参数说明

### createInstance 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| zoneId | String | ✅ | 可用区 ID |
| vpcId | String | ⚠️ | VPC ID（建议指定） |
| vSwitchId | String | ⚠️ | 交换机 ID（建议指定） |
| lindormType | String | ❌ | 实例类型，默认 'lindorm' |
| coreSpec | String | ✅ | 核心节点规格 |
| coreNumber | Number | ❌ | 核心节点数量，默认 2 |
| storageNumber | Number | ❌ | 存储节点数量，默认 2 |
| payType | String | ❌ | 付费类型，默认 'Postpaid' |
| instanceName | String | ❌ | 实例名称 |
| description | String | ❌ | 实例描述 |

### createV2Instance 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| zoneId | String | ✅ | 可用区 ID |
| vpcId | String | ⚠️ | VPC ID（建议指定） |
| vSwitchId | String | ⚠️ | 交换机 ID（建议指定） |
| seriesCode | String | ✅ | 实例系列代码 |
| coreSpec | String | ✅ | 核心节点规格 |
| coreDiskSize | Number | ✅ | 核心节点磁盘大小 (GB) |
| coreNumber | Number | ❌ | 核心节点数量，默认 2 |
| payType | String | ❌ | 付费类型，默认 'Postpaid' |

## ⚠️ 安全提醒

1. **白名单设置**: 避免使用 `0.0.0.0/0`，建议设置具体的 IP 段
2. **VPC 网络**: 建议指定 VPC 和交换机以增强网络安全性
3. **RAM 权限**: 使用 RAM 子账号，遵循最小权限原则
4. **凭证管理**: 不要在代码中硬编码 AKSK

## API 参考

完整 API 文档：https://help.aliyun.com/zh/lindorm/developer-reference/api-hitsdb-2020-06-15-overview

## 许可证

MIT
