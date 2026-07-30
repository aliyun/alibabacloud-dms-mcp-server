# MongoDB API 完整参考文档

## 概述

本文档详细列出【MongoDB 数据库操作】Skill 支持的所有 API，涵盖 10 大章节共计 45+ 个 API。

**API 版本**: 2015-12-01  
**Endpoint**: mongodb.aliyuncs.com  
**签名机制**: V1 (HMAC-SHA1)

---

## 1. 创建或克隆实例 (Create)

### 1.1 CreateDBInstance - 创建实例

**功能**: 创建 MongoDB 实例（副本集或分片集群）

**必填参数**:
| 参数名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| RegionId | string | 地域 ID | cn-hangzhou |
| Engine | string | 引擎类型 | MongoDB |
| EngineVersion | string | 引擎版本 | 4.4 |
| DBInstanceClass | string | 实例规格 | mdb.shard.2x.large.c |
| DBInstanceStorage | integer | 存储容量 (GB) | 20 |
| InstanceChargeType | string | 付费类型 | Postpaid |

**可选参数**:
| 参数名 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| DBInstanceName | string | 实例名称 | - |
| Password | string | 密码 | - |
| ZoneId | string | 可用区 ID | - |
| VPCId | string | VPC ID | - |
| VSwitchId | string | 交换机 ID | - |
| NodeAmount | integer | 节点数 | 3 |
| NetworkType | string | 网络类型 | VPC |
| ReplicationFactor | string | 副本数 | 3 |
| StorageEngine | string | 存储引擎 | WiredTiger |

---

### 1.2 CloneDBInstance - 克隆实例

**功能**: 从备份克隆实例

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| RegionId | string | 是 | 地域 ID |
| DBInstanceId | string | 是 | 源实例 ID |
| BackupId | string | 是 | 备份 ID |

---

## 2. 变更实例配置 (Modify)

### 2.1 ModifyDBInstanceSpec - 变更规格

**功能**: 变更实例规格或存储

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| DBInstanceClass | string | 否 | 新规格 |
| DBInstanceStorage | integer | 否 | 新存储 (GB) |

---

### 2.2 ModifyDBInstanceName - 修改名称

**功能**: 修改实例名称

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| DBInstanceName | string | 是 | 新名称 |

---

### 2.3 ModifyDBInstancePassword - 修改密码

**功能**: 修改实例密码

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| Password | string | 是 | 新密码 |

---

## 3. 实例管理 (Instance)

### 3.1 DeleteDBInstance - 删除实例

**功能**: 释放/删除实例

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 3.2 RestartDBInstance - 重启实例

**功能**: 手动重启实例

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 3.3 LockDBInstance - 锁定实例

**功能**: 手动锁定实例

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 3.4 UnlockDBInstance - 解锁实例

**功能**: 解锁实例

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

## 4. 查询实例 (Describe)

### 4.1 DescribeDBInstances - 查询实例列表

**功能**: 查询实例列表

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| RegionId | string | 是 | 地域 ID |
| DBInstanceId | string | 否 | 实例 ID |
| PageNumber | integer | 否 | 页码 |
| PageSize | integer | 否 | 每页数量 |

---

### 4.2 DescribeDBInstanceAttribute - 查询实例详情

**功能**: 查询实例详细信息

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 4.3 DescribeRegions - 查询地域列表

**功能**: 查看可用地域列表

**参数**: 无

---

### 4.4 DescribeAvailableResource - 查询可用资源

**功能**: 查询指定地域和可用区的可用资源

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| RegionId | string | 是 | 地域 ID |
| ZoneId | string | 否 | 可用区 ID |
| Engine | string | 否 | 引擎类型 |
| EngineVersion | string | 否 | 引擎版本 |

---

## 5. 连接管理 (Connection)

### 5.1 DescribeDBInstanceNetInfo - 查询连接信息

**功能**: 查询实例连接信息

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 5.2 AllocatePublicConnection - 申请公网地址

**功能**: 为实例申请公网连接地址

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| ConnectionStringPrefix | string | 否 | 自定义前缀 |

---

### 5.3 ReleasePublicConnection - 释放公网地址

**功能**: 释放公网连接地址

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| ConnectionString | string | 是 | 公网地址 |

---

## 6. 资源管理 (Resource)

### 6.1 ListTagResources - 查询标签

**功能**: 查询实例绑定的标签

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| RegionId | string | 是 | 地域 ID |
| ResourceType | string | 是 | 资源类型 |
| ResourceId | array | 是 | 资源 ID 列表 |

---

### 6.2 TagResources - 绑定标签

**功能**: 为实例绑定标签

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| RegionId | string | 是 | 地域 ID |
| ResourceType | string | 是 | 资源类型 |
| ResourceId | array | 是 | 资源 ID 列表 |
| Tag | array | 是 | 标签列表 |

---

### 6.3 UntagResources - 解绑标签

**功能**: 解绑实例标签

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| RegionId | string | 是 | 地域 ID |
| ResourceType | string | 是 | 资源类型 |
| ResourceId | array | 是 | 资源 ID 列表 |
| TagKey | array | 是 | 标签键列表 |

---

## 7. 账号管理 (Account)

### 7.1 CreateAccount - 创建账号

**功能**: 创建数据库账号

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| AccountName | string | 是 | 账号名称 |
| AccountPassword | string | 是 | 密码 |
| AccountDescription | string | 否 | 描述 |

**⚠️ 注意**: 副本集实例不支持创建额外账号

---

### 7.2 DeleteAccount - 删除账号

**功能**: 删除数据库账号

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| AccountName | string | 是 | 账号名称 |

---

### 7.3 DescribeAccounts - 查询账号列表

**功能**: 查询实例的账号列表

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 7.4 ResetAccountPassword - 重置密码

**功能**: 重置账号密码

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| AccountName | string | 是 | 账号名称 |
| AccountPassword | string | 是 | 新密码 |

---

### 7.5 GrantAccountPrivilege - 授权

**功能**: 授予账号数据库权限

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| AccountName | string | 是 | 账号名称 |
| DbName | string | 是 | 数据库名称 |
| AccountPrivilege | string | 是 | 权限类型 |

---

## 8. 白名单和安全组 (Security)

### 8.1 DescribeDBInstanceIPArrayList - 查询白名单

**功能**: 查询实例的 IP 白名单

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 8.2 ModifySecurityIps - 修改白名单

**功能**: 修改实例的 IP 白名单

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| SecurityIps | string | 是 | IP 列表 |
| SecurityIpGroupName | string | 否 | 白名单名称 |

---

### 8.3 DescribeDBInstanceSecurityGroups - 查询安全组

**功能**: 查询实例的安全组

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 8.4 ModifyDBInstanceSecurityGroups - 修改安全组

**功能**: 修改实例的安全组

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| SecurityGroupId | string | 是 | 安全组 ID |

---

## 9. 参数管理 (Parameter)

### 9.1 DescribeParameters - 查询参数

**功能**: 查询实例的参数配置

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 9.2 ModifyParameters - 修改参数

**功能**: 修改实例的参数配置

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| Parameters | string | 是 | JSON 格式参数 |

---

### 9.3 DescribeParameterTemplates - 查询参数模板

**功能**: 查询参数模板列表

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| RegionId | string | 是 | 地域 ID |
| Engine | string | 是 | 引擎类型 |
| EngineVersion | string | 是 | 引擎版本 |

---

### 9.4 ApplyParameterTemplate - 应用参数模板

**功能**: 将参数模板应用到实例

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| TemplateId | string | 是 | 模板 ID |

---

## 10. 备份与恢复 (Backup)

### 10.1 CreateBackup - 创建备份

**功能**: 创建实例备份

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| BackupMethod | string | 否 | 备份方式 |
| BackupName | string | 否 | 备份名称 |

---

### 10.2 DeleteBackup - 删除备份

**功能**: 删除备份

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| BackupId | string | 是 | 备份 ID |

---

### 10.3 DescribeBackups - 查询备份列表

**功能**: 查询备份列表

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 10.4 DescribeBackupPolicy - 查询备份策略

**功能**: 查询备份策略

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 10.5 ModifyBackupPolicy - 修改备份策略

**功能**: 修改备份策略

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| BackupTime | string | 否 | 备份时间 |
| BackupPeriod | string | 否 | 备份周期 |
| BackupRetentionPeriod | integer | 否 | 保留天数 |

---

### 10.6 RestoreDBInstance - 恢复实例

**功能**: 从备份恢复实例

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| BackupId | string | 是 | 备份 ID |

---

## 错误码参考

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| InvalidDBInstanceId.NotFound | 404 | 实例不存在 |
| InstanceTypeNotSupport | 403 | 实例类型不支持此操作 |
| InvalidPricePlanResult.NotFound | 400 | 价格方案查询失败 |
| InvalidChargeType | 400 | 付费类型无效 |

---

## 更新日志

- v1.0.0 (2026-04-02): 初始版本，包含 10 大章节核心 API
