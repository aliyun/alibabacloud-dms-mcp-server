# Redis API 完整参考文档

## 概述

本文档详细列出【Redis 数据库操作】Skill 支持的所有 API，涵盖 7 大章节共计 50+ 个 API。

**API 版本**: 2015-01-01  
**Endpoint**: r-kvstore.aliyuncs.com  
**签名机制**: V1 (HMAC-SHA1)

---

## 1. 生命周期管理 (Lifecycle) - 开源版 Redis

### 1.1 CreateInstance - 创建开源版 Redis 实例

**功能**: 创建社区版 Redis 实例

**必填参数**:
| 参数名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| RegionId | string | 地域 ID | cn-hangzhou |
| InstanceType | integer | 实例类型 (2=社区版) | 2 |
| EngineVersion | string | 引擎版本 | 6.0 |
| InstanceClass | string | 实例规格 | redis.master.small.default |
| Capacity | integer | 容量 (MB) | 256 |
| ChargeType | string | 付费类型 (Postpaid/Prepaid) | Postpaid |

**可选参数**:
| 参数名 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| NodeType | integer | 节点类型 (1=主从版) | 1 |
| InstanceName | string | 实例名称 | - |
| Password | string | 密码 | - |
| VpcId | string | VPC ID | - |
| VSwitchId | string | 交换机 ID | - |
| Quantity | integer | 购买数量 | 1 |
| AutoRenew | string | 是否自动续费 | false |

**返回参数**:
- InstanceId: 实例 ID
- OrderId: 订单 ID

---

### 1.2 DeleteInstance - 删除开源版 Redis 实例

**功能**: 释放/删除实例

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |

---

### 1.3 DescribeInstances - 查询实例列表

**功能**: 查询 Redis 实例列表

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| RegionId | string | 是 | 地域 ID |
| InstanceId | string | 否 | 实例 ID（精确查询） |
| InstanceType | integer | 否 | 实例类型 (2=社区版/3=企业版) |
| PageNumber | integer | 否 | 页码 (默认 1) |
| PageSize | integer | 否 | 每页数量 (默认 30) |

---

### 1.4 DescribeInstanceAttribute - 查询实例详情

**功能**: 查询指定实例的详细信息

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |

---

### 1.5 ModifyInstanceName - 修改实例名称

**功能**: 修改实例的名称

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |
| InstanceName | string | 是 | 新名称 |

---

### 1.6 RestartInstance - 重启实例

**功能**: 手动重启 Redis 实例

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |

---

### 1.7 ModifyInstanceCapacity - 变更容量

**功能**: 变更实例的容量配置

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |
| Capacity | integer | 是 | 新容量 (MB) |

---

### 1.8 DescribeRegions - 查询地域列表

**功能**: 查看可用地域列表

**参数**: 无

---

### 1.9 DescribeZones - 查询可用区列表

**功能**: 查看可用区列表

**参数**: 无

---

### 1.10 DescribeAvailableResource - 查询可用资源

**功能**: 查询指定地域和可用区的可用资源

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| RegionId | string | 是 | 地域 ID |
| ZoneId | string | 否 | 可用区 ID |
| InstanceChargeType | string | 否 | 付费类型 |
| ArchitectureType | string | 否 | 架构类型 |

---

## 2. 实例管理 (Instances) - 云原生 Tair

### 2.1 CreateDBInstance - 创建 Tair 实例

**功能**: 创建企业版 (Tair) 实例

**必填参数**:
| 参数名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| RegionId | string | 地域 ID | cn-hangzhou |
| InstanceType | integer | 实例类型 (3=企业版) | 3 |
| InstanceClass | string | 实例规格 | tair.scm.standard.2m.2d |
| Capacity | integer | 容量 (MB) | 256 |

---

### 2.2 DeleteDBInstance - 删除 Tair 实例

**功能**: 释放/删除 Tair 实例

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |

---

### 2.3 describeDBInstances - 查询 Tair 实例列表

**功能**: 查询企业版实例列表

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| RegionId | string | 是 | 地域 ID |
| InstanceType | integer | 否 | 实例类型 (3=企业版) |

---

## 3. 连接管理 (Connection)

### 3.1 DescribeConnectionDomain - 查询连接地址

**功能**: 查询实例的连接地址

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |

---

### 3.2 AllocatePublicConnection - 申请公网地址

**功能**: 为实例申请公网连接地址

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |

---

### 3.3 ReleasePublicConnection - 释放公网地址

**功能**: 释放公网连接地址

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |
| ConnectionDomain | string | 是 | 公网地址 |

---

## 4. 账号管理 (Accounts)

### 4.1 CreateAccount - 创建账号

**功能**: 创建数据库账号

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |
| AccountName | string | 是 | 账号名称 |
| Password | string | 是 | 密码 (8-32 位) |
| AccountType | string | 是 | 账号类型 (Normal/Super) |

---

### 4.2 DeleteAccount - 删除账号

**功能**: 删除数据库账号

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |
| AccountName | string | 是 | 账号名称 |

---

### 4.3 DescribeAccounts - 查询账号列表

**功能**: 查询实例的账号列表

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |

---

### 4.4 ResetAccountPassword - 重置密码

**功能**: 重置账号密码

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |
| AccountName | string | 是 | 账号名称 |
| Password | string | 是 | 新密码 |

---

### 4.5 GrantAccountPrivilege - 授权

**功能**: 授予账号数据库权限

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |
| AccountName | string | 是 | 账号名称 |
| DbName | string | 是 | 数据库名称 |
| AccountPrivilege | string | 是 | 权限类型 |

---

## 5. 网络安全 (Security)

### 5.1 DescribeSecurityIps - 查询 IP 白名单

**功能**: 查询实例的 IP 白名单

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |

---

### 5.2 ModifySecurityIps - 修改 IP 白名单

**功能**: 修改实例的 IP 白名单

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |
| SecurityIps | string | 是 | IP 列表 |
| ModifyMode | string | 否 | 修改模式 |

---

### 5.3 DescribeSSL - 查询 SSL 状态

**功能**: 查询实例的 SSL 加密状态

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |

---

### 5.4 ModifySSL - 修改 SSL 状态

**功能**: 开启或关闭 SSL 加密

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |
| SSLAction | string | 是 | Open/Close |

---

## 6. 参数管理 (Parameters)

### 6.1 DescribeParameters - 查询实例参数

**功能**: 查看实例的参数配置

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |

---

### 6.2 ModifyParameter - 修改实例参数

**功能**: 修改实例的参数配置

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |
| Config | string | 是 | JSON 格式参数 |

---

### 6.3 DescribeParameterTemplates - 查询参数模板

**功能**: 查看参数模板列表

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| RegionId | string | 是 | 地域 ID |
| EngineVersion | string | 是 | 引擎版本 |
| CharacterType | string | 是 | 字符类型 |

---

## 7. 备份恢复 (Backup)

### 7.1 CreateBackup - 创建备份

**功能**: 创建实例备份

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |
| BackupName | string | 否 | 备份名称 |

---

### 7.2 DeleteBackup - 删除备份

**功能**: 删除备份

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |
| BackupId | string | 是 | 备份 ID |

---

### 7.3 DescribeBackups - 查询备份列表

**功能**: 查询备份列表

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |
| PageNumber | integer | 否 | 页码 |
| PageSize | integer | 否 | 每页数量 |

---

### 7.4 DescribeBackupPolicy - 查询备份策略

**功能**: 查询备份策略

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |

---

### 7.5 ModifyBackupPolicy - 修改备份策略

**功能**: 修改备份策略

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |
| BackupTime | string | 否 | 备份时间 |
| BackupPeriod | string | 否 | 备份周期 |

---

### 7.6 RestoreInstance - 恢复数据

**功能**: 从备份恢复数据

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| InstanceId | string | 是 | 实例 ID |
| BackupId | string | 是 | 备份 ID |

---

## 错误码参考

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| InvalidInstanceId.NotFound | 404 | 实例不存在 |
| InvalidAccountName.NotFound | 404 | 账号不存在 |
| IncorrectInstanceStatus | 403 | 实例状态不支持 |
| OperationDenied.DeletionProtection | 400 | 开启释放保护 |
| InvalidPassword.Malformed | 400 | 密码格式错误 |

---

## 更新日志

- v1.0.0 (2026-04-02): 初始版本，包含 7 大章节核心 API
