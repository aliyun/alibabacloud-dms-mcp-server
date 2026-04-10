# BaaS Skill API 调用最佳实践指南

## 概述

本文档汇总了使用 BaaS Skill 及其 8 个子 Skill 进行阿里云数据库 API 调用的最佳实践，基于实际测试经验总结。

## CLI 使用策略

**当前版本不建议使用 CLI**，所有数据库操作通过 API 完成。

| 方式 | 状态 | 说明 |
|------|------|------|
| API | ✅ 推荐 | 通过阿里云 OpenAPI 直接调用，稳定性好，可控性高 |
| CLI | ⚠️ 不推荐 | 当前版本不建议使用，未来是否可用由用户决定 |

**原因**：
1. API 调用更可控，错误处理更完善
2. 避免 CLI 环境依赖问题
3. 便于集成到自动化流程中

## 核心原则

### 1. VPC 网络配置策略

**推荐做法**：不指定 VPC，让系统自动分配

```javascript
// ✅ 推荐：不指定 VPC，让系统自动分配
await createInstance({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h',
  // 不指定 vpcId 和 vSwitchId
});
```

**手动指定 VPC 的风险**：
- 如果指定的 VPC/交换机不在目标可用区，会报错：`InvalidvSwitchId`
- 如果指定可用区已售罄，会报错：`Zone.Closed`
- 如果 VPC/交换机状态异常，会报错：`InvalidVPC.NotFound`

### 2. 先查询可用资源再创建

不同可用区支持的规格不同，创建前应先查询可用资源：

```javascript
// PolarDB 示例
const resources = await describeDBClusterAvailableResources({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h'
});

// Redis 示例
const resources = await describeAvailableResource({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-i'
});
```

### 3. 等待实例就绪后再执行后续操作

```javascript
// 轮询等待实例状态变为 Running
async function waitForInstanceRunning(instanceId, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await describeInstanceAttribute(instanceId);
    if (status.DBInstanceStatus === 'Running') {
      return true;
    }
    await sleep(30000); // 等待 30 秒
  }
  throw new Error('实例启动超时');
}
```

## 各数据库产品 API 调用要点

### PolarDB

```javascript
// 1. 查询可用规格
const resources = await polardb.clusters.describeDBClusterAvailableResources({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h'
});

// 2. 创建实例（不指定 VPC）
await polardb.clusters.createDBCluster({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h',
  dbType: 'MySQL',
  dbVersion: '8.0',
  dbNodeClass: 'polar.mysql.x4.medium',
  dbNodeNum: '2',
  payType: 'Postpaid',
  dbClusterDescription: 'test-cluster',
  password: 'YourPassword123'
});
```

**关键参数**：
- `dbNodeClass`: 不同可用区支持的规格不同，需先查询
- `payType`: Postpaid（按量付费）或 Prepaid（包年包月）

### Redis

```javascript
// 1. 查询可用资源
const resources = await redis.lifecycle.describeAvailableResource({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-i'
});

// 2. 创建实例（不指定 VPC）
await redis.lifecycle.createInstance({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-i',
  instanceType: 'Redis',
  engineVersion: '5.0',
  instanceClass: 'redis.master.small.default',
  capacity: 256,
  instanceChargeType: 'PostPaid',
  instanceName: 'test-redis',
  password: 'YourPassword123'
});
```

**关键参数**：
- `zoneId`: 部分可用区可能已关闭（如 cn-hangzhou-h），建议尝试多个可用区
- `instanceClass`: 需查询可用资源后选择正确的规格名称
- `capacity`: 容量规格需与 instanceClass 匹配

### RDS

```javascript
await rds.instances.createInstance({
  regionId: 'cn-hangzhou',
  engine: 'MySQL',
  engineVersion: '8.0',
  dbInstanceClass: 'mysql.n2.small.2c',
  dbInstanceStorage: 20,
  payType: 'Postpaid',
  dbInstanceDescription: 'test-rds',
  password: 'YourPassword123'
});
```

**关键参数**：
- `dbInstanceClass`: 实例规格，如 mysql.n2.small.2c
- `dbInstanceStorage`: 存储容量（GB）

### ADB MySQL

```javascript
// 数仓版
await adb.clusters.createCluster({
  clusterType: 'warehouse',
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h',
  payType: 'Postpaid',
  dbClusterCategory: 'Cluster',
  mode: 'Reserver',
  dbClusterClass: 'C8',
  dbNodeGroupCount: '2',
  dbNodeStorage: '200',
  dbClusterVersion: '3.0',
  description: 'test-adb'
});
```

**关键参数**：
- `clusterType`: warehouse（数仓版）或 lakehouse（湖仓版）
- `dbClusterVersion`: 数仓版需要指定版本（如 3.0）
- `dbClusterClass`: 规格，如 C8、C32

### Lindorm

```javascript
await lindorm.instances.createInstance({
  zoneId: 'cn-hangzhou-i',
  lindormType: 'lindorm',
  coreSpec: 'lindorm.c.2xlarge',
  coreNumber: 2,
  storageNumber: 2,
  payType: 'Postpaid',
  instanceName: 'test-lindorm'
});
```

**关键参数**：
- `coreSpec`: 核心节点规格
- `coreNumber`: 核心节点数量
- `storageNumber`: 存储节点数量

### MongoDB

```javascript
await mongodb.create.createDBInstance({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h',
  engine: 'MongoDB',
  engineVersion: '4.4',
  dbInstanceClass: 'dds.mongo.mid',
  dbInstanceStorage: 20,
  instanceChargeType: 'Postpaid',
  dbInstanceName: 'test-mongodb',
  password: 'YourPassword123',
  nodeAmount: 3  // 副本集固定3节点
});
```

**关键参数**：
- `nodeAmount`: 副本集固定 3 节点
- `dbInstanceClass`: 需查询可用资源后选择

## 常见错误码及解决方案

| 错误码 | 产品 | 原因 | 解决方案 |
|--------|------|------|----------|
| InvalidvSwitchId | 通用 | 交换机不在指定可用区 | 不指定 VPC，让系统自动分配 |
| Zone.Closed | Redis/PolarDB | 该可用区已关闭或售罄 | 更换可用区或不指定 VPC |
| InvalidVPC.NotFound | 通用 | VPC/交换机无效 | 不指定 VPC，让系统自动分配 |
| COMMODITY.INVALID_COMPONENT | PolarDB | 规格与可用区不匹配 | 先查询可用规格再创建 |
| InvalidCapacity.NotFound | Redis | 容量规格不存在 | 查询可用资源后选择正确规格 |
| MissingDBClusterVersion | ADB | 缺少版本参数 | 添加 dbClusterVersion 参数 |
| OperationDenied.RegionZoneNotSupport | ADB | VPC与可用区不匹配 | 不指定 VPC，让系统自动分配 |
| InvalidPricePlanResult.NotFound | MongoDB | 价格方案查询失败 | 检查规格和地域 |

## 推荐创建流程

```
Step 1: 查询可用资源（规格、可用区）
    ↓
Step 2: 创建实例（不指定 VPC，让系统自动分配）
    ↓
Step 3: 等待实例状态变为 Running/Normal（轮询查询）
    ↓
Step 4: 创建数据库账号
    ↓
Step 5: 创建数据库
    ↓
Step 6: 设置白名单
    ↓
Step 7: 执行 DDL 创建表结构
    ↓
Step 8: 返回连接信息
```

## Python SDK 示例

### PolarDB

```python
from alibabacloud_polardb20170801.client import Client as PolarDBClient
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_credentials.client import Client as CredClient
from alibabacloud_credentials.models import Config as CredConfig

# 初始化凭证
cred_config = CredConfig(
    access_key_id='your-ak',
    access_key_secret='your-sk',
    type='access_key'
)
cred = CredClient(cred_config)

# 创建 PolarDB 客户端
config = open_api_models.Config(
    credential=cred,
    endpoint='polardb.aliyuncs.com',
    region_id='cn-hangzhou'
)
client = PolarDBClient(config)

# 创建实例
from alibabacloud_polardb20170801.models import CreateDBClusterRequest
request = CreateDBClusterRequest(
    region_id='cn-hangzhou',
    zone_id='cn-hangzhou-b',
    dbtype='MySQL',
    dbversion='8.0',
    dbnode_class='polar.mysql.x4.medium',
    dbnode_num='2',
    pay_type='Postpaid',
    creation_option='Normal'
)
response = client.create_dbcluster(request)
print(f"InstanceId: {response.body.db_cluster_id}")
```

### Redis

```python
from alibabacloud_r_kvstore20150101.client import Client as RedisClient
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_credentials.client import Client as CredClient
from alibabacloud_credentials.models import Config as CredConfig

# 初始化凭证
cred_config = CredConfig(
    access_key_id='your-ak',
    access_key_secret='your-sk',
    type='access_key'
)
cred = CredClient(cred_config)

# 创建 Redis 客户端
config = open_api_models.Config(
    credential=cred,
    endpoint='r-kvstore.aliyuncs.com',
    region_id='cn-hangzhou'
)
client = RedisClient(config)

# 创建实例
from alibabacloud_r_kvstore20150101.models import CreateInstanceRequest
request = CreateInstanceRequest(
    region_id='cn-hangzhou',
    zone_id='cn-hangzhou-i',
    instance_type='Redis',
    engine_version='5.0',
    instance_class='redis.master.small.default',
    capacity=256,
    instance_charge_type='PostPaid'
)
response = client.create_instance(request)
print(f"InstanceId: {response.body.instance_id}")
```

## 安全提醒

1. **不要在代码中硬编码 AKSK**，使用环境变量传入
2. **密码必须由用户提供**，严禁使用默认密码
3. **白名单设置**避免使用 `0.0.0.0/0`，生产环境应严格限制 IP 范围
4. **使用 RAM 子账号**，遵循最小权限原则

## 版本信息

- 文档版本：1.0.0
- 最后更新：2026-04-06
