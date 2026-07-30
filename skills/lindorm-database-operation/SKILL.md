# Lindorm 数据库操作 Skill

**版本**: 1.0.0  
**最后更新**: 2026-04-03

## 描述

阿里云 Lindorm (原 HitsDB) 数据库管理技能，使用 **V1 签名机制 (HMAC-SHA1)**，提供实例管理、白名单管理、标签管理、地域管理等 API 能力。

## 签名机制

**签名版本**: V1 (HMAC-SHA1)

**API 版本**: 2020-06-15

**Endpoint**: `hitsdb.aliyuncs.com`

## CLI 使用策略

**当前版本不建议使用 CLI**，所有操作通过 API 完成。

| 方式 | 状态 | 说明 |
|------|------|------|
| API | ✅ 推荐 | 通过阿里云 OpenAPI 直接调用，稳定性好，可控性高 |
| CLI | ⚠️ 不推荐 | 当前版本不建议使用，未来是否可用由用户决定 |

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
- 使用 OpenClaw 环境变量或配置对象传入
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

### 创建 Lindorm 实例

**⚠️ 重要**: 创建实例前请确保：
- 账户余额充足
- 了解按量付费的价格
- 测试完成后及时释放实例

```javascript
const LindormDatabaseOperation = require('./lindorm-database-operation');

const lindorm = new LindormDatabaseOperation({
  autoSelect: true,
  regionId: 'cn-hangzhou'
});

// 创建实例
const result = await lindorm.instances.createInstance({
  zoneId: 'cn-hangzhou-i',
  vpcId: 'vpc-xxx',
  vSwitchId: 'vsw-xxx',
  lindormType: 'lindorm',
  coreSpec: 'lindorm.c.2xlarge',
  coreNumber: 2,
  storageNumber: 2,
  payType: 'Postpaid',
  instanceName: 'test-instance',
  description: '测试实例'
});

console.log(`实例创建成功：${result.InstanceId}`);
```

### 完整创建示例

```javascript
const https = require('https');
const crypto = require('crypto');

// V1 签名算法
function sign(params, accessKeySecret) {
  const sorted = Object.keys(params).sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');
  const stringToSign = 'GET&%2F&' + encodeURIComponent(sorted);
  const hmac = crypto.createHmac('sha1', accessKeySecret + '&');
  hmac.update(stringToSign);
  return hmac.digest('base64');
}

async function createLindormInstance() {
  const accessKeyId = 'YOUR_ACCESS_KEY_ID';
  const accessKeySecret = 'YOUR_ACCESS_KEY_SECRET';
  
  const apiParams = {
    Action: 'CreateLindormInstance',
    Version: '2020-06-15',
    RegionId: 'cn-hangzhou',
    ZoneId: 'cn-hangzhou-h',
    PayType: 'POSTPAY',
    VPCId: 'vpc-xxx',
    VSwitchId: 'vsw-xxx',
    DiskCategory: 'cloud_efficiency',
    InstanceStorage: '480',
    LindormNum: 2,
    LindormSpec: 'lindorm.c.xlarge',
    Format: 'JSON',
    AccessKeyId: accessKeyId,
    SignatureMethod: 'HMAC-SHA1',
    Timestamp: new Date().toISOString(),
    SignatureVersion: '1.0',
    SignatureNonce: Math.random().toString(36).substring(7)
  };
  
  apiParams.Signature = sign(apiParams, accessKeySecret);
  
  const query = Object.keys(apiParams).sort()
    .map(k => `${k}=${encodeURIComponent(apiParams[k])}`)
    .join('&');
  
  return new Promise((resolve, reject) => {
    https.get(`https://hitsdb.cn-hangzhou.aliyuncs.com/?${query}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}
```

### 查询实例列表

```javascript
const instances = await lindorm.instances.describeInstances({
  pageNumber: 1,
  pageSize: 10
});

console.log(`实例总数：${instances.TotalCount}`);
instances.Instances?.Instance?.forEach(inst => {
  console.log(`- ${inst.InstanceId}: ${inst.InstanceName} (${inst.Status})`);
});
```

### 设置白名单

```javascript
// ⚠️ 安全提醒：不要使用 0.0.0.0/0
await lindorm.whitelist.updateWhitelist({
  instanceId: 'lindorm-xxx',
  ipList: '192.168.1.0/24,10.0.0.0/8'
});
```

### 查询支持的地域

```javascript
const regions = await lindorm.regions.describeRegions();
console.log('支持的地域:', regions);
```

## 参数校验

### createInstance 必需参数
- ✅ `zoneId` - 可用区 ID
- ✅ `coreSpec` - 核心节点规格
- ✅ `instanceStorage` - 存储容量（GB）

### createV2Instance 必需参数
- ✅ `zoneId` - 可用区 ID
- ✅ `seriesCode` - 实例系列代码
- ✅ `coreSpec` - 核心节点规格
- ✅ `coreDiskSize` - 核心节点磁盘大小

### 引擎参数（至少选择一种引擎）

| 引擎 | 数量参数 | 规格参数 | 示例 |
|------|----------|----------|------|
| 宽表引擎 | LindormNum | LindormSpec | LindormNum=2, LindormSpec=lindorm.c.xlarge |
| 搜索引擎 | SolrNum | SolrSpec | SolrNum=2, SolrSpec=solr.c.xlarge |
| 时序引擎 | TsdbNum | TsdbSpec | TsdbNum=2, TsdbSpec=tsdb.c.xlarge |
| 文件引擎 | FilestoreNum | FilestoreSpec | FilestoreNum=2, FilestoreSpec=filestore.c.xlarge |
| 流引擎 | StreamNum | StreamSpec | StreamNum=2, StreamSpec=stream.c.xlarge |
| LTS | LtsNum | LtsSpec | LtsNum=2, LtsSpec=lts.c.xlarge |

### 关键注意事项

1. **节点数量限制**
   - **总核心数必须 >= 2**
   - 如果只配置一种引擎，该引擎的节点数必须 >= 2
   - 如果配置多种引擎，各引擎节点数之和必须 >= 2

2. **VPC 和交换机匹配**
   - **交换机必须在指定的 ZoneId 中**
   - 错误示例：ZoneId=cn-hangzhou-h，但 VSwitchId 属于 cn-hangzhou-i
   - 正确做法：先查询 VPC 下的交换机及其所属可用区

3. **存储容量要求**
   - InstanceStorage 是 **必填参数**
   - 最小值取决于规格，通常为 480GB

4. **付费类型差异**

   **按量付费 (POSTPAY)**：
   ```javascript
   { PayType: 'POSTPAY' }
   ```

   **包年包月 (PREPAY)**：
   ```javascript
   {
     PayType: 'PREPAY',
     PricingCycle: 'Month',  // Month 或 Year
     Duration: 1,            // 购买时长
     AutoRenewal: false,     // 是否自动续费（可选）
     AutoRenewDuration: 1    // 自动续费时长（可选，1-12月）
   }
   ```

## 常见错误及解决方案

| 错误码 | 错误信息 | 原因 | 解决方案 |
|--------|----------|------|----------|
| InvalidParameter.InstanceStorage | The specified parameter InstanceStorage is empty | 缺少 InstanceStorage 参数 | 添加 InstanceStorage 参数，最小 480GB |
| InvalidParameter.TotalCoreCount | The total core num should be at least 2 | 总核心数不足 | 增加引擎节点数，确保总核心数 >= 2 |
| LindormErrorCode.VpcOrVswitchInvalid | 请检查虚拟网络和虚拟交换机是否已选择 | 交换机不在指定可用区 | 确保 VSwitchId 属于指定的 ZoneId |

## ⚠️ 安全提醒

1. **白名单设置**: 避免使用 `0.0.0.0/0`，建议设置具体的 IP 段
2. **VPC 网络**: 建议指定 VPC 和交换机以增强网络安全性
3. **RAM 权限**: 使用 RAM 子账号，遵循最小权限原则
4. **凭证管理**: 不要在代码中硬编码 AKSK

## API 参考

完整 API 文档：https://help.aliyun.com/zh/lindorm/developer-reference/api-hitsdb-2020-06-15-overview

## 许可证

MIT
