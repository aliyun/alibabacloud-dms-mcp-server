# RDS API 完整参考文档

## 概述

本文档详细列出【RDS 数据库操作】Skill 支持的所有 API，涵盖 7 大章节共计 110+ 个 API。

---

## 1. 实例管理 (Instance)

### 1.1 CreateDBInstance - 创建 RDS 实例

**功能**: 创建新的 RDS 实例

**必填参数**:
| 参数名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| RegionId | string | 地域 ID | cn-hangzhou |
| Engine | string | 数据库类型 (MySQL/SQLServer/PostgreSQL/MariaDB) | MySQL |
| EngineVersion | string | 数据库版本 | 8.0 |
| DBInstanceClass | string | 实例规格 | mysql.n2.medium.2c |
| DBInstanceStorage | integer | 存储空间 (GB) | 100 |
| PayType | string | 付费类型 (Postpaid/Prepaid) | Postpaid |

**可选参数**:
| 参数名 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| DBInstanceStorageType | string | 存储类型 (local_ssd/general_essd/cloud_essd) | general_essd |
| Category | string | 实例系列 (Basic/HighAvailability/cluster) | HighAvailability |
| ZoneId | string | 主节点可用区 | - |
| VPCId | string | 专有网络 ID | - |
| VSwitchId | string | 交换机 ID | - |
| SecurityIPList | string | IP 白名单 | - |
| DBInstanceDescription | string | 实例名称 | - |
| AutoRenew | string | 是否自动续费 (true/false) | false |
| ClientToken | string | 幂等性令牌 | - |

**返回参数**:
- DBInstanceId: 实例 ID
- ConnectionString: 连接地址
- Port: 端口号
- OrderId: 订单 ID

---

### 1.2 DeleteDBInstance - 释放 RDS 实例

**功能**: 释放/删除 RDS 实例

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

**注意**: 
- 按量付费实例可直接删除
- 包年包月实例需先转为按量付费

---

### 1.3 DescribeDBInstances - 查询实例列表

**功能**: 查询 RDS 实例列表

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| RegionId | string | 是 | 地域 ID |
| Engine | string | 否 | 数据库类型 |
| DBInstanceId | string | 否 | 实例 ID（精确查询） |
| DBInstanceStatus | string | 否 | 实例状态 |
| PayType | string | 否 | 付费类型 |
| PageNumber | integer | 否 | 页码 (默认 1) |
| PageSize | integer | 否 | 每页数量 (默认 30) |

---

### 1.4 DescribeDBInstanceAttribute - 查询实例详情

**功能**: 查询指定实例的详细信息

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 1.5 RestartDBInstance - 重启实例

**功能**: 手动重启 RDS 实例

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 1.6 StopDBInstance - 暂停实例

**功能**: 暂停 RDS 实例

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 1.7 StartDBInstance - 启动实例

**功能**: 启动已暂停的 RDS 实例

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 1.8 ModifyDBInstanceSpec - 变更实例规格

**功能**: 变更实例的规格和存储空间

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| DBInstanceClass | string | 是 | 新规格 |
| DBInstanceStorage | integer | 是 | 新存储空间 |

---

### 1.9 ModifyDBInstanceDescription - 修改实例名称

**功能**: 修改 RDS 实例的名称/描述

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| DBInstanceDescription | string | 是 | 新名称 |

---

### 1.10 DescribeRegions - 查询地域列表

**功能**: 查询所有可用的地域和可用区

**参数**: 无

---

### 1.11 DescribeAvailableZones - 查询可用区资源

**功能**: 查询指定地域的可用区资源

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| RegionId | string | 是 | 地域 ID |
| Engine | string | 否 | 数据库类型 |
| DBInstanceCategory | string | 否 | 实例系列 |

---

### 1.12 ModifyInstanceAutoRenewalAttribute - 修改自动续费

**功能**: 修改实例的自动续费设置

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| AutoRenew | string | 是 | 是否自动续费 |
| Duration | integer | 否 | 续费周期 |

---

### 1.13 RenewInstance - 手动续费

**功能**: 为包年包月实例手动续费

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| Period | string | 是 | 续费周期 |

---

### 1.14 ModifyDBInstanceDeletionProtection - 修改释放保护

**功能**: 开启或关闭实例的释放保护

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| DeletionProtection | string | 是 | true/false |

---

## 2. 账号管理 (Account)

### 2.1 CreateAccount - 创建数据库账号

**功能**: 在 RDS 实例下创建数据库账号

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| AccountName | string | 是 | 账号名称 |
| AccountPassword | string | 是 | 账号密码 |
| AccountDescription | string | 否 | 账号描述 |
| AccountType | string | 否 | 账号类型 (Normal/Super) |

**密码要求**:
- 长度 8-32 位
- 包含大写字母、小写字母、数字、特殊字符中的至少三种
- 特殊字符：! @ # $ % ^ & * () _ + - =

---

### 2.2 DeleteAccount - 删除数据库账号

**功能**: 删除 RDS 实例的数据库账号

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| AccountName | string | 是 | 账号名称 |

---

### 2.3 DescribeAccounts - 查询账号列表

**功能**: 查询 RDS 实例的账号信息

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| AccountName | string | 否 | 账号名称（精确查询） |

---

### 2.4 ResetAccountPassword - 重置账号密码

**功能**: 重置数据库账号的密码

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| AccountName | string | 是 | 账号名称 |
| AccountPassword | string | 是 | 新密码 |

---

### 2.5 GrantAccountPrivilege - 授权账号

**功能**: 授予账号对数据库的访问权限

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| AccountName | string | 是 | 账号名称 |
| DBName | string | 是 | 数据库名称 |
| AccountPrivilege | string | 是 | 权限 (ReadWrite/ReadOnly/DDLOnly/DMLOnly) |

---

### 2.6 RevokeAccountPrivilege - 撤销权限

**功能**: 撤销账号对数据库的访问权限

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| AccountName | string | 是 | 账号名称 |
| DBName | string | 是 | 数据库名称 |

---

### 2.7 LockAccount - 锁定账号

**功能**: 锁定 RDS PostgreSQL 数据库账号

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| AccountName | string | 是 | 账号名称 |

---

### 2.8 UnlockAccount - 解锁账号

**功能**: 解锁 RDS PostgreSQL 数据库账号

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| AccountName | string | 是 | 账号名称 |

---

## 3. 数据库管理 (Database)

### 3.1 CreateDatabase - 创建数据库

**功能**: 在 RDS 实例下创建数据库

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| DBName | string | 是 | 数据库名称 |
| CharacterSetName | string | 否 | 字符集 (默认 utf8) |
| AccountName | string | 否 | 授权账号名称 |
| AccountPrivilege | string | 否 | 账号权限 |
| DBDescription | string | 否 | 数据库描述 |

---

### 3.2 DeleteDatabase - 删除数据库

**功能**: 删除 RDS 实例中的数据库

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| DBName | string | 是 | 数据库名称 |

---

### 3.3 DescribeDatabases - 查询数据库列表

**功能**: 查询 RDS 实例下的数据库信息

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| DBName | string | 否 | 数据库名称（精确查询） |

---

### 3.4 ModifyDBDescription - 修改数据库备注

**功能**: 修改数据库的备注说明

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| DBName | string | 是 | 数据库名称 |
| DBDescription | string | 是 | 新描述 |

---

### 3.5 CheckDBNameAvailable - 检查数据库名称

**功能**: 检查数据库名称是否可用

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| DBName | string | 是 | 数据库名称 |

---

## 4. 安全加密 (Security)

### 4.1 ModifySecurityIps - 修改 IP 白名单

**功能**: 修改 RDS 实例的 IP 白名单配置

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| SecurityIps | string | 是 | IP 地址列表 (逗号分隔) |
| SecurityIpGroupName | string | 否 | 白名单分组名称 |
| ModifyMode | string | 否 | 修改模式 (Cover/Append/Delete) |

**IP 格式**:
- IP 地址：192.168.1.1
- CIDR: 192.168.1.0/24

---

### 4.2 DescribeDBInstanceIPArrayList - 查询 IP 白名单

**功能**: 查询 RDS 实例的 IP 白名单

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 4.3 ModifyDBInstanceSSL - 修改 SSL 配置

**功能**: 开启或关闭 SSL 链路加密

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| SSLAction | string | 是 | Open/Close |

---

### 4.4 DescribeDBInstanceSSL - 查询 SSL 配置

**功能**: 查询 RDS 实例的 SSL 配置

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 4.5 ModifyDBInstanceTDE - 修改 TDE 加密

**功能**: 开启或关闭透明数据加密

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| TDEStatus | string | 是 | Enabled/Disabled |

---

### 4.6 DescribeDBInstanceTDE - 查询 TDE 状态

**功能**: 查询 TDE 加密状态

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 4.7 ModifySecurityGroupConfiguration - 修改安全组

**功能**: 修改 RDS 实例关联的 ECS 安全组

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| SecurityGroupId | string | 是 | 安全组 ID |

---

## 5. 网络与连接地址 (Network)

### 5.1 AllocateInstancePublicConnection - 申请外网地址

**功能**: 为 RDS 实例申请外网连接地址

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| ConnectionStringPrefix | string | 否 | 连接地址前缀 |

---

### 5.2 ReleaseInstancePublicConnection - 释放外网地址

**功能**: 释放 RDS 实例的外网连接地址

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 5.3 DescribeDBInstanceNetInfo - 查询连接地址

**功能**: 查询实例的所有连接地址信息

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 5.4 ModifyDBInstanceConnectionString - 修改连接地址

**功能**: 修改实例的连接地址和端口

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| ConnectionString | string | 是 | 当前连接地址 |
| ConnectionStringPrefix | string | 是 | 新的连接地址前缀 |

---

### 5.5 SwitchDBInstanceVpc - 切换 VPC

**功能**: 切换 RDS 实例的 VPC 和交换机

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| VPCId | string | 是 | 新的 VPC ID |
| VSwitchId | string | 是 | 新的交换机 ID |

---

## 6. 备份管理 (Backup)

### 6.1 CreateBackup - 创建备份

**功能**: 为 RDS 实例创建备份集

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| BackupStrategy | string | 否 | Manual/Automated |
| BackupMethod | string | 否 | Snapshot/Log |
| BackupName | string | 否 | 备份名称 |

---

### 6.2 DeleteBackup - 删除备份

**功能**: 删除实例的数据备份文件

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| BackupId | string | 是 | 备份集 ID |

---

### 6.3 DescribeBackups - 查询备份列表

**功能**: 查看 RDS 实例的备份集列表

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| BackupStatus | string | 否 | 备份状态 |
| StartTime | string | 否 | 开始时间 (ISO 8601) |
| EndTime | string | 否 | 结束时间 (ISO 8601) |
| PageNumber | integer | 否 | 页码 |
| PageSize | integer | 否 | 每页数量 |

---

### 6.4 DescribeBackupPolicy - 查询备份策略

**功能**: 查询实例的备份设置

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |

---

### 6.5 ModifyBackupPolicy - 修改备份策略

**功能**: 修改 RDS 实例的备份策略

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| PreferredBackupTime | string | 否 | 备份时间 (HH:MMZ-HH:MMZ) |
| PreferredBackupPeriod | string | 否 | 备份周期 (Monday,Tuesday...) |
| BackupRetentionPeriod | integer | 否 | 保留天数 (7-730) |
| BackupLog | string | 否 | 日志备份 (Enabled/Disabled) |

---

### 6.6 DescribeBinlogFiles - 查询 Binlog 文件

**功能**: 查看 Binlog/Wal 日志文件

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| StartTime | string | 否 | 开始时间 |
| EndTime | string | 否 | 结束时间 |
| PageNumber | integer | 否 | 页码 |
| PageSize | integer | 否 | 每页数量 |

---

## 7. 参数管理 (Parameters)

### 7.1 DescribeParameters - 查询实例参数列表

**功能**: 查看 RDS 实例的参数配置信息

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| ParameterGroupId | string | 否 | 参数模板 ID |
| PageNumber | integer | 否 | 页码 (默认 1) |
| PageSize | integer | 否 | 每页数量 (默认 30) |

**返回参数**:
- Items.DBParameter: 参数列表
  - ParameterName: 参数名称
  - ParameterValue: 当前值
  - ParameterDefault: 默认值
  - ParameterStatus: 参数状态 (Running/Modified)
  - CheckStatus: 校验状态
  - ForceRestart: 是否需要重启
  - ForceModify: 是否可修改

---

### 7.2 ModifyParameter - 修改实例参数

**功能**: 修改 RDS 实例的参数配置

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBInstanceId | string | 是 | 实例 ID |
| Parameters | string | 是 | 参数数组 (JSON 格式) |
| ForceRestart | string | 否 | 是否强制重启 (true/false) |

**Parameters 格式**:
```json
{
  "parameters": [
    {"ParameterName": "max_connections", "ParameterValue": "2000"},
    {"ParameterName": "wait_timeout", "ParameterValue": "28800"}
  ]
}
```

**注意**:
- 部分参数修改后需要重启实例才能生效
- 修改前建议先查询参数可修改范围

---

### 7.3 DescribeParameterGroups - 查询参数模板列表

**功能**: 查看参数模板列表

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| RegionId | string | 是 | 地域 ID |
| ParameterGroupId | string | 否 | 参数模板 ID |
| ParameterGroupName | string | 否 | 参数模板名称 |
| Engine | string | 否 | 数据库类型 |
| EngineVersion | string | 否 | 数据库版本 |
| PageNumber | integer | 否 | 页码 |
| PageSize | integer | 否 | 每页数量 |

**返回参数**:
- Items.DBParameterGroup: 参数模板列表
  - ParameterGroupId: 模板 ID
  - ParameterGroupName: 模板名称
  - Engine: 数据库类型
  - EngineVersion: 数据库版本
  - Description: 描述
  - CreatedTime: 创建时间

---

### 7.4 CreateParameterGroup - 创建参数模板

**功能**: 创建自定义参数模板

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ParameterGroupName | string | 是 | 模板名称 |
| Engine | string | 是 | 数据库类型 |
| EngineVersion | string | 是 | 数据库版本 |
| Parameters | string | 否 | 参数数组 (JSON 格式) |
| Description | string | 否 | 描述 |

**Parameters 格式**:
```json
{
  "parameters": [
    {"ParameterName": "max_connections", "ParameterValue": "2000"}
  ]
}
```

---

### 7.5 ModifyParameterGroup - 修改参数模板

**功能**: 修改参数模板信息

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ParameterGroupId | string | 是 | 模板 ID |
| ParameterGroupName | string | 否 | 新名称 |
| Description | string | 否 | 新描述 |
| Parameters | string | 否 | 参数数组 (JSON 格式) |

---

### 7.6 DeleteParameterGroup - 删除参数模板

**功能**: 删除自定义参数模板

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ParameterGroupId | string | 是 | 模板 ID |

**注意**:
- 系统默认模板不可删除
- 已应用于实例的模板需先解绑

---

### 7.7 ApplyParameterGroup - 应用参数模板到实例

**功能**: 将参数模板应用到 RDS 实例

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ParameterGroupId | string | 是 | 模板 ID |
| DBInstanceId | string | 是 | 实例 ID |

**注意**:
- 应用后实例参数将被模板中的参数覆盖
- 部分参数可能需要重启实例生效

---

### 7.8 DescribeParameterGroupDetail - 查询参数模板详情

**功能**: 查看参数模板的详细信息

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ParameterGroupId | string | 是 | 模板 ID |

**返回参数**:
- ParameterGroup: 模板详情
  - ParameterGroupId: 模板 ID
  - ParameterGroupName: 模板名称
  - Engine: 数据库类型
  - EngineVersion: 数据库版本
  - Parameters: 参数列表
  - Description: 描述

---

## 错误码参考

### 常见错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| InvalidDBInstanceId.NotFound | 404 | 实例不存在 |
| InvalidAccountName.NotFound | 404 | 账号不存在 |
| InvalidDBName.Duplicate | 400 | 数据库名称已存在 |
| IncorrectDBInstanceState | 403 | 实例状态不支持此操作 |
| OperationDenied.DeletionProtection | 400 | 实例开启释放保护 |
| AccountLimitExceeded | 403 | 超过账号数量上限 |

---

## 最佳实践

### 1. 实例创建
- 生产环境建议使用高可用系列 (HighAvailability)
- 选择与 ECS 相同的可用区可降低延迟
- 初始白名单建议只添加应用服务器 IP

### 2. 账号管理
- 遵循最小权限原则
- 生产环境避免使用高权限账号
- 定期更换密码

### 3. 备份策略
- 建议开启自动备份
- 备份保留期根据业务需求设置 (7-730 天)
- 重要操作前手动创建备份

### 4. 安全配置
- 开启 SSL 加密
- 定期审查白名单
- 敏感数据开启 TDE 加密

---

## 更新日志

- v1.1.0 (2026-04-02): 新增参数管理章节 (8 个 API)
- v1.0.0 (2026-04-01): 初始版本，包含 6 大章节核心 API
