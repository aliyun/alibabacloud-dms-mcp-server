# PolarDB API 完整参考文档

## 概述

本文档详细列出【PolarDB 数据库操作】Skill 支持的所有 API，涵盖 8 大章节共计 60+ 个 API。

---

## 1. 集群管理 (Clusters)

### 1.1 CreateDBCluster - 创建集群

**功能**: 创建新的 PolarDB 集群

**必填参数**:
| 参数名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| DBType | string | 数据库类型 (MySQL/PostgreSQL/Oracle) | MySQL |
| DBVersion | string | 数据库版本 | 8.0 |
| PayType | string | 付费类型 (Postpaid/Prepaid) | Postpaid |
| DBNodeClass | string | 节点规格 | polar.mysql.x4.medium |

**可选参数**:
| 参数名 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| DBNodes | integer | 节点数量 | 1 |
| RegionId | string | 地域 ID | cn-hangzhou |
| VPCId | string | 专有网络 ID | - |
| VSwitchId | string | 交换机 ID | - |
| Description | string | 集群描述 | - |

**返回参数**:
- DBClusterId: 集群 ID
- RequestId: 请求 ID

---

### 1.2 DeleteDBCluster - 删除集群

**功能**: 释放/删除 PolarDB 集群

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |

---

### 1.3 DescribeClusters - 查询集群列表

**功能**: 查询 PolarDB 集群列表

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| RegionId | string | 是 | 地域 ID |
| DBClusterId | string | 否 | 集群 ID（精确查询） |
| PageNumber | integer | 否 | 页码 (默认 1) |
| PageSize | integer | 否 | 每页数量 (默认 30) |

---

### 1.4 DescribeClusterAttribute - 查询集群详情

**功能**: 查询指定集群的详细信息

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |

---

### 1.5 ModifyClusterDescription - 修改集群描述

**功能**: 修改集群的描述信息

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| DBClusterDescription | string | 是 | 新描述 |

---

## 2. 账号管理 (Accounts)

### 2.1 CreateAccount - 创建账号

**功能**: 创建数据库账号

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| AccountName | string | 是 | 账号名称 |
| AccountPassword | string | 是 | 密码 (8-32 位，至少 3 种字符) |
| AccountType | string | 是 | 账号类型 (Normal/Super) | Normal |
| AccountDescription | string | 否 | 账号描述 | - |

---

### 2.2 DeleteAccount - 删除账号

**功能**: 删除数据库账号

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| AccountName | string | 是 | 账号名称 |

---

### 2.3 DescribeAccounts - 查询账号列表

**功能**: 查询集群的账号列表

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| AccountName | string | 否 | 账号名称（精确查询） |

---

### 2.4 ModifyAccountPassword - 修改账号密码

**功能**: 重置账号密码

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| AccountName | string | 是 | 账号名称 |
| AccountPassword | string | 是 | 新密码 |

---

### 2.5 GrantAccountPrivilege - 授权账号

**功能**: 授予账号数据库权限

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| AccountName | string | 是 | 账号名称 |
| DBName | string | 是 | 数据库名称 |
| AccountPrivilege | string | 是 | 权限类型 (ReadWrite/ReadOnly/DDLOnly/DMLOnly) |

---

## 3. 数据库管理 (Databases)

### 3.1 CreateDatabase - 创建数据库

**功能**: 创建数据库

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| DBName | string | 是 | 数据库名称 |
| CharacterSetName | string | 是 | 字符集 (utf8mb4/utf8/gbk) | utf8mb4 |
| AccountName | string | 否 | 授权账号 | - |
| AccountPrivilege | string | 否 | 权限类型 | ReadWrite |

---

### 3.2 DeleteDatabase - 删除数据库

**功能**: 删除数据库

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| DBName | string | 是 | 数据库名称 |

---

### 3.3 DescribeDatabases - 查询数据库列表

**功能**: 查询集群的数据库列表

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| DBName | string | 否 | 数据库名称（精确查询） |

---

### 3.4 ModifyDatabaseDescription - 修改数据库描述

**功能**: 修改数据库的描述信息

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| DBName | string | 是 | 数据库名称 |
| DBDescription | string | 是 | 新描述 |

---

## 4. 白名单管理 (Whitelist)

### 4.1 DescribeWhitelist - 查询白名单

**功能**: 查询集群的 IP 白名单

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |

---

### 4.2 ModifyWhitelist - 修改白名单

**功能**: 修改集群的 IP 白名单

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| SecurityIps | string | 是 | IP 列表 (逗号分隔) |
| ModifyMode | string | 否 | 修改模式 (Append/Delete/Overwrite) | Append |

---

## 5. 备份管理 (Backup)

### 5.1 CreateBackup - 创建备份

**功能**: 创建集群备份

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| BackupType | string | 是 | 备份类型 (Snapshot/Manual) | Manual |
| BackupName | string | 否 | 备份名称 | - |

---

### 5.2 DeleteBackup - 删除备份

**功能**: 删除备份

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| BackupId | string | 是 | 备份 ID |

---

### 5.3 DescribeBackups - 查询备份列表

**功能**: 查询备份列表

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| BackupStatus | string | 否 | 备份状态 |
| PageNumber | integer | 否 | 页码 |
| PageSize | integer | 否 | 每页数量 |

---

### 5.4 DescribeBackupPolicy - 查询备份策略

**功能**: 查询集群的备份策略

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |

---

## 6. 访问地址管理 (Endpoints)

### 6.1 DescribeEndpoints - 查询访问地址

**功能**: 查询集群的访问地址

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |

---

### 6.2 CreatePublicConnection - 创建公网地址

**功能**: 为集群创建公网访问地址

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| ConnectionStringPrefix | string | 是 | 自定义前缀 |
| Port | string | 否 | 端口号 | 3306 |

---

### 6.3 DeletePublicConnection - 删除公网地址

**功能**: 释放公网访问地址

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| ConnectionString | string | 是 | 公网地址 |

---

## 7. 连接诊断 (Connection)

### 7.1 DescribeClusterConnectivity - 连接性测试

**功能**: 测试从指定 IP 到集群的连接性

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| SourceIp | string | 是 | 源 IP 地址 |

---

### 7.2 DescribeClusterSSL - 查询 SSL 状态

**功能**: 查询集群的 SSL 加密状态

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |

---

### 7.3 ModifyClusterSSL - 修改 SSL 状态

**功能**: 开启或关闭集群的 SSL 加密

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| SSLAction | string | 是 | 操作 (Open/Close) |

---

## 8. 参数管理 (Parameters)

### 8.1 DescribeDBClusterConfig - 查询集群参数

**功能**: 查看 PolarDB 集群的参数配置信息

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
| ParameterGroupId | string | 否 | 参数模板 ID |
| PageNumber | integer | 否 | 页码 (默认 1) |
| PageSize | integer | 否 | 每页数量 (默认 30) |

**返回参数**:
- Items.DBClusterParameter: 参数列表
  - ParameterName: 参数名称
  - ParameterValue: 当前值
  - ParameterDefault: 默认值
  - ParameterStatus: 参数状态 (Running/Modified)
  - CheckStatus: 校验状态
  - ForceRestart: 是否需要重启
  - ForceModify: 是否可修改

---

### 8.2 ModifyDBClusterConfig - 修改集群参数

**功能**: 修改 PolarDB 集群的参数配置

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| DBClusterId | string | 是 | 集群 ID |
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
- 部分参数修改后需要重启集群才能生效
- 修改前建议先查询参数可修改范围

---

### 8.3 DescribeParameterGroups - 查询参数模板列表

**功能**: 查看参数模板列表

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| RegionId | string | 是 | 地域 ID |
| ParameterGroupId | string | 否 | 参数模板 ID |
| ParameterGroupName | string | 否 | 参数模板名称 |
| DBType | string | 否 | 数据库类型 |
| DBVersion | string | 否 | 数据库版本 |
| PageNumber | integer | 否 | 页码 |
| PageSize | integer | 否 | 每页数量 |

**返回参数**:
- Items.DBParameterGroup: 参数模板列表
  - ParameterGroupId: 模板 ID
  - ParameterGroupName: 模板名称
  - DBType: 数据库类型
  - DBVersion: 数据库版本
  - Description: 描述
  - CreatedTime: 创建时间

---

### 8.4 CreateParameterGroup - 创建参数模板

**功能**: 创建自定义参数模板

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ParameterGroupName | string | 是 | 模板名称 |
| DBType | string | 是 | 数据库类型 |
| DBVersion | string | 是 | 数据库版本 |
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

### 8.5 ModifyParameterGroup - 修改参数模板

**功能**: 修改参数模板信息

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ParameterGroupId | string | 是 | 模板 ID |
| ParameterGroupName | string | 否 | 新名称 |
| Description | string | 否 | 新描述 |
| Parameters | string | 否 | 参数数组 (JSON 格式) |

---

### 8.6 DeleteParameterGroup - 删除参数模板

**功能**: 删除自定义参数模板

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ParameterGroupId | string | 是 | 模板 ID |

**注意**:
- 系统默认模板不可删除
- 已应用于集群的模板需先解绑

---

### 8.7 ApplyParameterGroup - 应用参数模板到集群

**功能**: 将参数模板应用到 PolarDB 集群

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ParameterGroupId | string | 是 | 模板 ID |
| DBClusterId | string | 是 | 集群 ID |

**注意**:
- 应用后集群参数将被模板中的参数覆盖
- 部分参数可能需要重启集群生效

---

### 8.8 DescribeParameterGroupDetail - 查询参数模板详情

**功能**: 查看参数模板的详细信息

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ParameterGroupId | string | 是 | 模板 ID |

**返回参数**:
- ParameterGroup: 模板详情
  - ParameterGroupId: 模板 ID
  - ParameterGroupName: 模板名称
  - DBType: 数据库类型
  - DBVersion: 数据库版本
  - Parameters: 参数列表
  - Description: 描述

---

## 错误码参考

### 常见错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| InvalidDBClusterId.NotFound | 404 | 集群不存在 |
| InvalidAccountName.NotFound | 404 | 账号不存在 |
| InvalidDBName.Duplicate | 400 | 数据库名称已存在 |
| IncorrectDBClusterStatus | 403 | 集群状态不支持此操作 |
| OperationDenied.DeletionProtection | 400 | 集群开启释放保护 |
| AccountLimitExceeded | 403 | 超过账号数量上限 |

---

## 最佳实践

### 1. 集群创建
- 生产环境建议选择多节点部署
- 选择与 ECS 相同的地域和可用区
- 初始白名单建议只添加应用服务器 IP

### 2. 账号管理
- 遵循最小权限原则
- 生产环境避免使用高权限账号
- 定期更换密码

### 3. 备份策略
- 建议开启自动备份
- 备份保留期根据业务需求设置
- 重要操作前手动创建备份

### 4. 安全配置
- 开启 SSL 加密
- 定期审查白名单
- 敏感数据开启 TDE 加密

### 5. 参数管理
- 修改参数前先查询当前值和可修改范围
- 部分参数需要重启集群才能生效
- 建议使用参数模板统一管理多个集群的配置

---

## 更新日志

- v1.1.0 (2026-04-02): 新增参数管理章节 (8 个 API)
- v1.0.0 (2026-04-01): 初始版本，包含 7 大章节核心 API
