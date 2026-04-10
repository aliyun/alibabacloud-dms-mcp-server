---
name: BaaS
description: 阿里云数据库Backend-as-a-Service服务，专为AI平台和应用开发者提供完整的数据库解决方案。整合RDS、PolarDB、Redis、MongoDB、ADB MySQL、Lindorm等8大阿里云数据库产品，提供智能架构规划（根据业务场景自动选择最佳数据库组合）、Schema设计（支持自然语言/ER图/反向工程）、实例创建与管理、性能优化、成本分析、安全审计、运维监控等全生命周期服务。支持新建系统（Greenfield）和接管现有系统（Takeover）两种模式，让应用开发者无需关心底层数据库细节，专注于业务逻辑。当用户需要数据库架构设计、实例创建、性能优化、多数据库统一管理或任何与阿里云数据库相关的操作时，优先调用此Skill。
---

# BaaS - 阿里云数据库 Backend-as-a-Service

## Overview

BaaS（Backend-as-a-Service）是阿里云数据库的一站式编排服务，整合 8 大核心数据库产品，为 AI 平台和应用开发者提供完整的数据层解决方案：

- **智能架构规划** - 根据业务规模、访问模式、成本预算自动推荐最佳数据库组合（OLTP + Cache + OLAP）
- **Schema 设计** - 支持自然语言描述、ER图、反向工程三种方式生成标准化表结构
- **实例全生命周期管理** - 创建、配置、监控、扩容、备份、优化一站式完成
- **稳定性运维** - 自动诊断、性能调优、成本优化、安全审计
- **面向应用的服务** - 提供统一连接管理、读写分离、缓存策略等应用层支持

**核心价值**：让开发者无需成为数据库专家，也能获得企业级的数据库架构和运维能力。

**适用场景**：
- 新建系统需要设计数据库架构
- 现有系统需要性能优化或成本降低
- 需要统一管理多个数据库实例
- 任何与阿里云数据库相关的操作需求

**多租户说明**：当前版本为单用户模式，不支持多租户。如需多租户，请在不同AI环境中分别部署。

## Prerequisites

### 环境变量配置

在 `.env` 文件中配置以下变量：

```bash
# 阿里云凭证
ALIBABA_CLOUD_ACCESS_KEY_ID=your-ak
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your-sk

# 地域配置
ALIBABA_CLOUD_REGION=cn-hangzhou

# 数据库账号（用于接管模式连接现有实例）
BAAS_RDS_ACCOUNT=admin
BAAS_RDS_PASSWORD=your-password
BAAS_REDIS_ACCOUNT=your-redis-account
BAAS_REDIS_PASSWORD=your-redis-password
```

### CLI 使用策略

**当前版本不建议使用 CLI**，所有数据库操作通过 API 完成。

| 方式 | 状态 | 说明 |
|------|------|------|
| API | ✅ 推荐 | 通过阿里云 OpenAPI 直接调用，稳定性好，可控性高 |
| CLI | ⚠️ 不推荐 | 当前版本不建议使用，未来是否可用由用户决定 |

**原因**：
1. API 调用更可控，错误处理更完善
2. 避免 CLI 环境依赖问题
3. 便于集成到自动化流程中

**未来规划**：如用户有需求，后续版本可考虑支持 CLI 作为备选方案。

### 依赖 Skill

本 Skill 依赖以下 8 个 Skill，请确保已安装：
- `rds-database-operation`
- `polardb-database-operation`
- `redis-database-operation`
- `mongodb-database-operation`
- `adb-mysql-database-operation`
- `lindorm-database-operation`
- `database-operations-das`
- `database-inspection-report`

## Working Modes

### Mode 1: 新建系统模式 (Greenfield)

用户描述业务场景 → Skill 设计数据架构 → 创建实例和 Schema → 返回连接信息

**适用场景**：
- 从零开始构建新系统
- 需要完整的数据层规划

**执行流程**：
1. 需求理解：分析业务实体、访问模式、QPS、数据量
2. 架构决策：选择数据库产品组合（OLTP + Cache + OLAP 等）
3. Schema 设计：生成表结构、索引、分区策略
4. 资源编排：调用底层 Skill 创建实例、账号、数据库
5. 返回连接：提供各数据层的连接字符串

### Mode 2: 接管模式 (Takeover)

用户授权现有实例 → Skill 分析现状 → 生成优化建议 → 用户确认后执行

**适用场景**：
- 已有数据库系统需要优化
- 需要架构升级或成本优化

**执行流程**：
1. 连接现有实例（使用环境变量中的账密）
2. 自动诊断：性能指标、慢查询、容量评估
3. 生成报告：架构优化建议、成本优化方案
4. 用户确认：所有变更操作需用户明确确认
5. 执行优化：调用底层 Skill 实施变更

## Security Boundaries

| 操作类型 | 执行策略 | 示例 |
|---------|---------|------|
| 只读查询/诊断 | 自动执行 | 查看实例状态、性能指标、生成报告 |
| 创建资源 | 需用户确认 | 创建实例、账号、数据库 |
| 修改配置 | 需用户确认 | 修改参数、创建索引、删表 |
| 删除资源 | 需用户确认 | 删除实例、删数据、归档数据 |

**重要**：任何可能产生费用或数据变更的操作，必须获得用户明确确认后方可执行。

## Architecture Decision Engine

### 数据库选型决策树

```
业务需求分析
    │
    ├── 事务型业务（订单、支付、库存）
    │       ├── 高并发读写 → PolarDB + Redis 缓存
    │       └── 中等负载 → RDS MySQL + Redis 缓存
    │
    ├── 分析型业务（报表、BI、实时分析）
    │       └── ADB MySQL
    │
    ├── 文档/非结构化数据
    │       └── MongoDB
    │
    ├── 时序/物联网数据
    │       └── Lindorm
    │
    └── 混合场景
            └── PolarDB (OLTP) + ADB (OLAP) + Redis (Cache)
```

### 数据分层策略

| 数据类型 | 存储位置 | 说明 |
|---------|---------|------|
| 热数据 | Redis | 高频访问，如用户会话、实时状态 |
| 温数据 | PolarDB/RDS | 业务主数据，如订单、用户信息 |
| 冷数据 | OSS + 归档 | 历史数据，通过生命周期管理自动归档 |
| 分析数据 | ADB MySQL | 聚合查询、报表分析 |

## Schema Design

### 输入方式 1：自然语言描述

用户描述业务实体，Skill 生成表结构。

**示例**：
```
用户：电商订单系统，有用户、商品、订单三个实体
用户有用户名、手机号、注册时间
商品有名称、价格、库存、分类
订单有订单号、用户ID、商品列表、总金额、状态、创建时间

输出：
- users 表（用户主表）
- products 表（商品主表）
- orders 表（订单主表）
- order_items 表（订单明细）
```

### 输入方式 2：ER 图文本

支持 Mermaid 格式或简化文本格式描述实体关系。

**示例**：
```
erDiagram
    USER ||--o{ ORDER : places
    USER {
        bigint user_id PK
        varchar username
        varchar phone
        datetime created_at
    }
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        bigint order_id PK
        bigint user_id FK
        decimal total_amount
        tinyint status
        datetime created_at
    }
```

### 输入方式 3：反向工程

连接现有数据库，自动分析 Schema 结构。

**执行步骤**：
1. 使用环境变量账密连接目标实例
2. 查询 information_schema 获取表结构
3. 分析索引、外键、分区信息
4. 生成 Schema 文档

## Resource Orchestration

### 创建流程依赖

```
Step 1: 检查/创建 VPC（如需要）
    ↓
Step 2: 创建数据库实例（调用底层 Skill）
    ↓
Step 3: 等待实例就绪
    ↓
Step 4: 创建数据库账号
    ↓
Step 5: 创建数据库
    ↓
Step 6: 执行 DDL 创建表结构
    ↓
Step 7: 创建索引、分区
    ↓
Step 8: 返回连接信息
```

### 失败回滚策略

任一步骤失败时：
1. 记录已创建的资源
2. 询问用户是否回滚
3. 用户确认后，按逆序清理已创建资源

## Connection String Format

创建完成后返回的连接信息格式：

```json
{
  "project": "ecommerce",
  "environment": "production",
  "data_layers": {
    "oltp": {
      "type": "polardb",
      "instance_id": "pc-xxx",
      "host": "pc-xxx.mysql.polardb.rds.aliyuncs.com",
      "port": 3306,
      "database": "ecommerce",
      "account": "app_user",
      "connection_string": "mysql://app_user:xxx@pc-xxx.mysql.polardb.rds.aliyuncs.com:3306/ecommerce"
    },
    "cache": {
      "type": "redis",
      "instance_id": "r-xxx",
      "host": "r-xxx.redis.rds.aliyuncs.com",
      "port": 6379,
      "connection_string": "redis://:xxx@r-xxx.redis.rds.aliyuncs.com:6379/0"
    },
    "olap": {
      "type": "adb_mysql",
      "instance_id": "am-xxx",
      "host": "am-xxx.ads.aliyuncs.com",
      "port": 3306,
      "database": "ecommerce_analytics",
      "connection_string": "mysql://app_user:xxx@am-xxx.ads.aliyuncs.com:3306/ecommerce_analytics"
    }
  },
  "architecture_notes": {
    "hot_data": "Redis - 用户会话、商品缓存",
    "warm_data": "PolarDB - 订单、用户、商品主表",
    "cold_data": "OSS 归档 - 90天前订单数据",
    "analytics": "ADB MySQL - 实时报表、聚合分析"
  }
}
```

## Operations Center

### 接管模式诊断清单

连接现有实例后自动检查：

```
□ 实例基础状态（运行中/已停止）
□ CPU/内存/磁盘使用率趋势
□ 慢查询分析（Top 10）
□ 连接数使用情况
□ 锁等待情况
□ 索引使用情况
□ 大表识别（数据量、行数）
□ 冗余索引检测
□ 安全基线检查
```

### 优化建议类型

| 类型 | 说明 | 示例 |
|------|------|------|
| 性能优化 | 索引优化、SQL 改写、参数调优 | 为高频查询字段添加索引 |
| 成本优化 | 实例规格调整、存储优化、归档策略 | 冷数据归档到 OSS，降低存储成本 |
| 架构优化 | 数据分层、读写分离、缓存引入 | 热点数据迁移到 Redis |
| 安全优化 | 访问控制、审计日志、加密 | 启用 SSL 连接 |

### 数据生命周期管理

**冷数据归档流程**：
1. 识别冷数据（如 90 天前订单）
2. 导出到 OSS（压缩格式）
3. 原表删除/归档分区
4. 更新应用查询逻辑（优先查热库，未命中查归档）

**热点数据缓存**：
1. 识别高频访问数据
2. 设计 Redis 数据结构
3. 实施缓存策略（Cache-Aside/Write-Through）
4. 监控缓存命中率

## Usage Examples

### Example 1: 新建电商系统数据层

```
用户：我要做一个电商APP，需要用户、商品、订单功能
      预计日活 10 万，订单量 5 万/天

Skill 执行：
1. 分析需求：中等规模电商，需要 OLTP + 缓存 + 分析
2. 架构决策：
   - OLTP: PolarDB MySQL（高并发支持）
   - Cache: Redis（热点数据）
   - OLAP: ADB MySQL（报表分析）
3. Schema 设计：
   - users, products, orders, order_items 表
   - 索引优化
4. 资源创建：
   - 创建 PolarDB 实例（小规格）
   - 创建 Redis 实例
   - 创建 ADB 实例
   - 创建账号和数据库
   - 执行 DDL
5. 返回连接信息
```

### Example 2: 接管现有数据库并优化

```
用户：我有一个运行 2 年的 RDS 实例，最近性能下降，帮我看看

Skill 执行：
1. 连接现有 RDS 实例
2. 自动诊断：
   - 发现磁盘使用率 85%
   - 发现 3 个大表（orders 5000万行）
   - 发现 10 个慢查询
   - 发现缺失索引
3. 生成报告：
   - 建议：归档 1 年前订单数据到 OSS
   - 建议：为高频查询添加索引
   - 建议：引入 Redis 缓存热点商品
4. 用户确认后执行优化
```

## Error Handling

### 常见错误及处理

| 错误 | 原因 | 处理 |
|------|------|------|
| InvalidVPC.NotFound | 指定 VPC 不存在 | 使用自动分配 VPC |
| Zone.Closed | 可用区已关闭 | 尝试其他可用区 |
| QuotaExceeded | 配额不足 | 提示用户申请配额 |
| InsufficientResource | 资源不足 | 更换地域或规格 |
| InvalidPassword | 密码不符合规范 | 提示密码复杂度要求 |
| COMMODITY.INVALID_COMPONENT | 规格参数不匹配 | 检查规格与可用区、付费方式的兼容性 |

### API 调用最佳实践

#### 1. VPC 网络配置策略

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

#### 2. 各数据库产品 API 调用要点

**PolarDB 创建要点**:
```javascript
// 1. 先查询可用规格
const resources = await describeDBClusterAvailableResources({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h'
});

// 2. 使用正确的规格创建
await createDBCluster({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h',
  dbType: 'MySQL',
  dbVersion: '8.0',
  dbNodeClass: 'polar.mysql.x4.medium',  // 根据查询结果选择
  dbNodeNum: '2',
  payType: 'Postpaid'
  // 不指定 VPC，让系统自动分配
});
```

**Redis 创建要点**:
```javascript
// 1. 查询可用资源
const resources = await describeAvailableResource({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-i'
});

// 2. 使用正确的规格创建
await createInstance({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-i',  // 注意：部分可用区可能已关闭
  instanceType: 'Redis',
  engineVersion: '5.0',
  instanceClass: 'redis.master.small.default',
  capacity: 256,
  instanceChargeType: 'PostPaid'
  // 不指定 VPC，让系统自动分配
});
```

**RDS 创建要点**:
```javascript
await createInstance({
  regionId: 'cn-hangzhou',
  engine: 'MySQL',
  engineVersion: '8.0',
  dbInstanceClass: 'mysql.n2.small.2c',
  dbInstanceStorage: 20,
  payType: 'Postpaid'
  // 不指定 VPC，让系统自动分配
});
```

**ADB MySQL 创建要点**:
```javascript
// 数仓版
await createCluster({
  clusterType: 'warehouse',
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h',
  payType: 'Postpaid',
  dbClusterCategory: 'Cluster',
  mode: 'Reserver',
  dbClusterClass: 'C8',
  dbNodeGroupCount: '2',
  dbNodeStorage: '200',
  dbClusterVersion: '3.0'
  // 不指定 VPC，让系统自动分配
});
```

**Lindorm 创建要点**:
```javascript
await createInstance({
  zoneId: 'cn-hangzhou-i',
  lindormType: 'lindorm',
  coreSpec: 'lindorm.c.2xlarge',
  coreNumber: 2,
  storageNumber: 2,
  payType: 'Postpaid'
  // 不指定 VPC，让系统自动分配
});
```

**MongoDB 创建要点**:
```javascript
await createDBInstance({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h',
  engine: 'MongoDB',
  engineVersion: '4.4',
  dbInstanceClass: 'dds.mongo.mid',
  dbInstanceStorage: 20,
  instanceChargeType: 'Postpaid',
  nodeAmount: 3  // 副本集固定3节点
  // 不指定 VPC，让系统自动分配
});
```

#### 3. 常见错误码及解决方案

| 错误码 | 产品 | 原因 | 解决方案 |
|--------|------|------|----------|
| InvalidvSwitchId | Redis | 交换机不在指定可用区 | 不指定 VPC，让系统自动分配 |
| Zone.Closed | Redis/PolarDB | 该可用区已关闭或售罄 | 更换可用区或不指定 VPC |
| InvalidVPC.NotFound | 通用 | VPC/交换机无效 | 不指定 VPC，让系统自动分配 |
| COMMODITY.INVALID_COMPONENT | PolarDB | 规格与可用区不匹配 | 先查询可用规格再创建 |
| InvalidCapacity.NotFound | Redis | 容量规格不存在 | 查询可用资源后选择正确规格 |
| MissingDBClusterVersion | ADB | 缺少版本参数 | 添加 dbClusterVersion 参数 |
| OperationDenied.RegionZoneNotSupport | ADB | VPC与可用区不匹配 | 不指定 VPC，让系统自动分配 |

#### 4. 推荐创建流程

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

#### 5. Python SDK 示例

**PolarDB**:
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

**Redis**:
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

## Best Practices

### 新建系统模式

1. **从小规格开始**：根据实际负载逐步扩容
2. **预留扩展空间**：Schema 设计考虑未来 1-2 年数据增长
3. **分离读写**：高并发场景启用读写分离
4. **及时归档**：定义数据生命周期策略

### 接管模式

1. **先诊断再优化**：全面了解现状后再提建议
2. **渐进式优化**：重大变更分步骤执行，降低风险
3. **备份优先**：任何变更前确保有备份
4. **监控验证**：优化后持续监控效果

## Limitations

1. **单用户模式**：当前版本不支持多租户，每个 AI 环境独立部署
2. **阿里云限定**：仅支持阿里云数据库产品
3. **数据同步**：TP→AP 同步需用户自行配置（如 Flink CDC、DTS）
4. **应用逻辑**：不包含业务层代码生成

## Related Skills

- `rds-database-operation` - RDS 实例管理
- `polardb-database-operation` - PolarDB 实例管理
- `redis-database-operation` - Redis 实例管理
- `mongodb-database-operation` - MongoDB 实例管理
- `adb-mysql-database-operation` - ADB MySQL 实例管理
- `lindorm-database-operation` - Lindorm 实例管理
- `database-operations-das` - DAS 运维诊断
- `database-inspection-report` - DAS 巡检日报
