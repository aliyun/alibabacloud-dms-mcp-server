# ADB MySQL 数据库操作 Skill

**版本**: 1.1.0  
**最后更新**: 2026-04-03

## 描述

阿里云 AnalyticDB MySQL 版（ADB）数据库管理技能，使用 **V1 签名机制 (HMAC-SHA1)**，提供完整的 ADB 集群管理能力。

**支持两种版本**：
- **数仓版**（API 版本：2019-03-15）- Cluster 系列
- **湖仓版**（API 版本：2021-12-01）- 湖仓版系列

包含 **10 大功能模块**：
1. 集群管理
2. 资源组管理
3. 数据库管理
4. 网络管理
5. 账号管理
6. 安全管理
7. 备份恢复
8. 监控管理
9. SQL 诊断
10. 空间分析

## ⚠️ 重要：可用区和网络配置

### ZoneId（可用区）选择

**支持的可用区**（以杭州为例）：
- `cn-hangzhou-h` - 杭州 可用区 H ✅ 推荐
- `cn-hangzhou-g` - 杭州 可用区 G
- `cn-hangzhou-k` - 杭州 可用区 K

**查询可用区方法**：
```javascript
const resources = await adb.client.callAPI('DescribeAvailableResource', {
  RegionId: 'cn-hangzhou'
});
```

### VPC 和交换机配置

**⚠️ 重要规则**：
1. **VPC 和交换机必须与 ZoneId 匹配**
2. **如果不指定 VPC，系统会自动分配**（推荐）
3. **如果指定 VPC，必须确保在该可用区有资源**

**推荐做法**：
```javascript
// ✅ 推荐：不指定 VPC，让系统自动分配
await adb.clusters.createCluster({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h',  // 指定可用区
  // 不指定 vpcId 和 vSwitchId，系统自动分配
  // ...
});
```

**高级用法**（仅在确保证书匹配时使用）：
```javascript
// ⚠️ 仅在确保证书匹配时使用
await adb.clusters.createCluster({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h',
  vpcId: 'vpc-xxx',  // 必须在该可用区
  vSwitchId: 'vsw-xxx',  // 必须在该可用区
  // ...
});
```

**常见错误**：
```
OperationDenied.RegionZoneNotSupport
```
**原因**：VPC 或交换机不在指定的可用区  
**解决**：不指定 VPC，或确保 VPC/交换机在指定可用区

## 签名机制

**签名版本**: V1 (HMAC-SHA1)

**API 版本**: 2019-03-15

**Endpoint**: `adb.aliyuncs.com`

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

### 1. 集群管理 (clusters)
- `createCluster()` - 创建集群
- `deleteCluster()` - 删除集群
- `modifyCluster()` - 升降配
- `describeClusters()` - 查询集群列表（支持跨地域）
- `describeClusterStatus()` - 查询集群状态
- `describeClusterAttribute()` - 查询集群详情
- `modifyClusterDescription()` - 修改集群备注名
- `modifyClusterPayType()` - 修改付费类型

### 2. 资源组管理 (resourceGroups)
- `createDBResourceGroup()` - 创建资源组
- `deleteDBResourceGroup()` - 删除资源组
- `describeDBResourceGroup()` - 查询资源组
- `modifyDBResourceGroup()` - 修改资源组
- `bindDBResourceGroupWithUser()` - 绑定用户
- `unbindDBResourceGroupWithUser()` - 解绑用户

### 3. 数据库管理 (databases)
- `describeSchemas()` - 查询数据库列表
- `describeTables()` - 查询表列表
- `describeTableDetail()` - 查询表详情
- `describeColumns()` - 查询列列表
- `describeAllDataSource()` - 枚举所有数据源
- `getCreateTableSQL()` - 获取建表语句

### 4. 网络管理 (network)
- `describeDBClusterNetInfo()` - 查询网络信息
- `allocateClusterPublicConnection()` - 申请公网地址
- `releaseClusterPublicConnection()` - 释放公网地址
- `modifyClusterConnectionString()` - 修改连接地址
- `describeVpcs()` - 查询 VPC 列表
- `describeVSwitches()` - 查询交换机列表

### 5. 账号管理 (accounts)
- `createAccount()` - 创建账号
- `deleteAccount()` - 删除账号
- `describeAccounts()` - 查询账号信息
- `describeAllAccounts()` - 查询所有账号
- `resetAccountPassword()` - 重置密码
- `modifyAccountDescription()` - 修改备注

### 6. 安全管理 (security)
- `modifyDBClusterAccessWhiteList()` - 设置白名单
- `describeDBClusterAccessWhiteList()` - 查询白名单
- `describeDBClusterSSL()` - 查询 SSL 配置
- `modifyDBClusterSSL()` - 修改 SSL 配置

### 7. 备份恢复 (backup)
- `describeBackupPolicy()` - 查询备份策略
- `modifyBackupPolicy()` - 修改备份策略
- `describeBackups()` - 查询备份集列表
- `deleteBackups()` - 删除备份集

### 8. 监控管理 (monitor)
- `describeDBClusterPerformance()` - 查询性能数据
- `describeDBClusterHealthStatus()` - 查询健康状态
- `describeInclinedTables()` - 查询表监控
- `describeDBClusterSpaceSummary()` - 查询空间概览

### 9. SQL 诊断 (diagnosis)
- `describeDiagnosisRecords()` - 查询诊断记录
- `describeDiagnosisSQLInfo()` - 查询 SQL 详情
- `describeSlowLogRecords()` - 查询慢日志
- `describeProcessList()` - 查询运行中的查询
- `killProcess()` - 终止查询

### 10. 空间分析 (spaceAnalysis)
- `describeTableStatistics()` - 查询表统计
- `describeExcessivePrimaryKeys()` - 检测主键过多表
- `describeOversizeNonPartitionTableInfos()` - 查询过大非分区表
- `describeTableAccessCount()` - 查询表访问统计

### 湖仓版特有功能（2021-12-01）

**网络管理**：
- `describeClusterNetInfo()` - 查询网络信息
- `allocateClusterPublicConnection()` - 申请公网地址
- `releaseClusterPublicConnection()` - 释放公网地址

**账号管理**：
- `createAccount()` - 创建账号
- `deleteAccount()` - 删除账号
- `describeAccounts()` - 查询账号
- `resetAccountPassword()` - 重置密码
- `modifyAccountDescription()` - 修改备注

**备份管理**：
- `createBackup()` - 创建备份
- `describeBackupPolicy()` - 查询备份策略
- `modifyBackupPolicy()` - 修改备份策略
- `describeBackups()` - 查询备份列表
- `deleteBackups()` - 删除备份

**白名单管理**：
- `describeClusterAccessWhiteList()` - 查询白名单
- `modifyClusterAccessWhiteList()` - 修改白名单

### 地域管理 (regions)
- `describeRegions()` - 查询支持的地域

## 使用示例

### 基础用法

```javascript
const ADBMySQLDatabaseOperation = require('./adb-mysql-database-operation');

const adb = new ADBMySQLDatabaseOperation({
  autoSelect: true,
  regionId: 'cn-hangzhou'
});

// 查询凭证信息
const cred = await adb.getCredentialInfo();
console.log(`使用凭证：${cred.name}`);

// 查询集群列表
const clusters = await adb.clusters.describeClusters();
console.log(clusters);
```

### 创建集群

**⚠️ 重要**：
- 创建集群前必须选择 **集群类型**（数仓版或湖仓版）
- 创建集群需要等待 **5-10 分钟**
- **不要指定 VPC**，让系统自动分配（避免可用区不匹配错误）
- 集群创建完成后才能创建账号、设置白名单等

#### 数仓版（推荐）

```javascript
// ✅ 数仓版集群（2019-03-15）
const result = await adb.clusters.createCluster({
  clusterType: 'warehouse',  // 数仓版
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h',  // 可用区 H（推荐）
  payType: 'Postpaid',
  dbClusterCategory: 'Cluster',  // 集群系列
  mode: 'Reserver',  // 预留模式
  dbClusterClass: 'C8',  // 规格：C8 或 C32
  dbNodeGroupCount: '2',  // 节点组数（1-200）
  dbNodeStorage: '200',  // 存储容量（C8: 100-1000GB）
  dbClusterVersion: '3.0',  // 版本
  description: '数仓版测试集群'
});

console.log(`集群 ID: ${result.DBClusterId}`);
console.log(`订单 ID: ${result.OrderId}`);
```

#### 湖仓版

```javascript
// ✅ 湖仓版集群（2021-12-01）
const result = await adb.clusters.createCluster({
  clusterType: 'lakehouse',  // 湖仓版
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h',
  payType: 'Postpaid',
  commodityCode: 'ads_post',  // 商品代码
  executorCount: '2',  // 计算节点数量
  diskCategory: 'cloud_effd',  // 磁盘类型
  diskSize: '500',  // 磁盘大小（GB）
  description: '湖仓版测试集群'
});

console.log(`集群 ID: ${result.DBClusterId}`);
console.log(`订单 ID: ${result.OrderId}`);
```

**查询集群状态**：
```javascript
const status = await adb.clusters.describeClusterStatus(result.DBClusterId);
console.log(`集群状态：${status.DBClusterStatus}`);  // Creating → Running
```

**参数说明**：

##### 数仓版参数

| 参数 | 必需 | 说明 | 示例值 |
|------|------|------|--------|
| clusterType | ✅ | 集群类型 | warehouse |
| regionId | ✅ | 地域 ID | cn-hangzhou |
| zoneId | ✅ | 可用区 ID | cn-hangzhou-h |
| dbClusterCategory | ✅ | 集群系列 | Cluster |
| mode | ✅ | 模式 | Reserver |
| dbClusterClass | ✅ | 规格 | C8 或 C32 |
| dbNodeGroupCount | ✅ | 节点组数 | 2（1-200） |
| dbNodeStorage | ✅ | 存储容量 | 200（GB） |
| dbClusterVersion | ✅ | 版本 | 3.0 |
| payType | ✅ | 付费类型 | Postpaid |

##### 湖仓版参数

| 参数 | 必需 | 说明 | 示例值 |
|------|------|------|--------|
| clusterType | ✅ | 集群类型 | lakehouse |
| regionId | ✅ | 地域 ID | cn-hangzhou |
| zoneId | ✅ | 可用区 ID | cn-hangzhou-h |
| commodityCode | ✅ | 商品代码 | ads_post |
| executorCount | ✅ | 计算节点数 | 2 |
| diskCategory | ✅ | 磁盘类型 | cloud_effd |
| diskSize | ✅ | 磁盘大小 | 500（GB） |
| payType | ✅ | 付费类型 | Postpaid |

### 查询所有地域的集群

```javascript
// 跨地域查询
const clusters = await adb.clusters.describeClusters({
  allRegions: true
});

console.log(`共找到 ${clusters.TotalCount} 个集群`);
clusters.Items.DBCluster.forEach(cluster => {
  console.log(`- [${cluster.RegionId}] ${cluster.DBClusterId}: ${cluster.DBClusterDescription}`);
});
```

### 设置白名单

```javascript
// ⚠️  安全提醒：不要使用 0.0.0.0/0
await adb.security.modifyDBClusterAccessWhiteList({
  dbClusterId: 'adb-xxx',
  ipList: '192.168.1.0/24,10.0.0.0/8'
});
```

### 查询慢日志

```javascript
const slowLogs = await adb.diagnosis.describeSlowLogRecords({
  dbClusterId: 'adb-xxx',
  startTime: '2026-04-03T00:00:00Z',
  endTime: '2026-04-03T23:59:59Z',
  pageNumber: 1,
  pageSize: 30
});

console.log(`找到 ${slowLogs.TotalRecordCount} 条慢日志`);
```

## ⚠️ 安全提醒

1. **白名单设置**: 避免使用 `0.0.0.0/0`，建议设置具体的 IP 段
2. **VPC 网络**: 建议指定 VPC 和交换机以增强网络安全性
3. **RAM 权限**: 使用 RAM 子账号，遵循最小权限原则
4. **凭证管理**: 不要在代码中硬编码 AKSK
5. **SSL 加密**: 建议开启 SSL 加密连接

## API 参考

完整 API 文档：https://help.aliyun.com/zh/analyticdb/analyticdb-for-mysql/developer-reference/api-adb-2019-03-15-overview

## 许可证

MIT
