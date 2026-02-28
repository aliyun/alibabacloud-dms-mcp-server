# DMS Enterprise 核心接口参数速查

说明：以下为常用接口的高频参数摘要，完整参数与约束以官方文档为准（见 `sources.md`）。

## 实例管理

### RegisterInstance（注册实例）

- Tid
- InstanceType（MySQL / PostgreSQL / SQLServer / Redis / MongoDB 等）
- InstanceSource（PUBLIC_OWN / RDS / ECS_OWN / VPC_IDC 等）
- Host / Port
- DatabaseUser / DatabasePassword
- NetworkType（CLASSIC / VPC）
- RegionId（实例所在地域）
- Sid（Oracle 专用）
- SafeRuleId（安全规则集 ID，可选）

### ListInstances（实例列表）

- Tid
- SearchKey（实例名/Host 模糊搜索）
- DbType（按数据库类型过滤）
- InstanceState（NORMAL / DISABLE）
- PageNumber / PageSize

### GetInstance（实例详情）

- Tid
- Host / Port

### UpdateInstance（修改实例）

- Tid
- InstanceId
- 其他可修改字段同 RegisterInstance

### DeleteInstance（删除实例）

- Tid
- Host / Port

## 数据库与表

### SearchDatabase（搜索数据库）

- Tid
- SearchKey（库名关键词）

### SearchTable（搜索表）

- Tid
- SearchKey（表名关键词）

### GetMetaTableDetailInfo（表详情）

- Tid
- TableGuid（格式: `{dbType}:{instanceId}:{schemaName}.{tableName}`）

## SQL 执行

### ExecuteScript（执行 SQL）

- Tid
- DbId（目标数据库 ID，从 SearchDatabase 获取）
- Script（SQL 内容）
- Logic（是否逻辑库模式）

### NL2SQL（自然语言转 SQL）

- Tid
- DbId
- Question（自然语言描述）

## 权限管理

### ListUserPermissions（查询权限）

- Tid
- UserId
- PermType（DATABASE / TABLE / COLUMN）
- PageNumber / PageSize

### GrantUserPermission（授权）

- Tid
- UserId
- DsType（DATABASE / TABLE / COLUMN）
- DatabaseId / TableId
- PermTypes（查询:QUERY / 变更:CORRECT / 导出:EXPORT）
- ExpireDate

### RevokeUserPermission（回收权限）

- Tid
- UserId
- DsType
- DatabaseId / TableId
- PermTypes

## 数据变更工单

### CreateOrder（创建工单）

- Tid
- PluginType（DATA_CORRECT / DATA_EXPORT / PERM_APPLY 等）
- OrderParam（JSON，各类型工单参数不同）

### GetOrderBaseInfo（查询工单）

- Tid
- OrderId

### ApproveOrder / CloseOrder

- Tid
- OrderId

## 任务编排

### ListTaskFlow（任务流列表）

- Tid

### CreateTaskFlow（创建任务流）

- Tid
- DagName

### GetTaskFlowGraph（DAG 图）

- Tid
- DagId

### PublishAndDeployTaskFlow

- Tid
- DagId

## 安全与审计

### ListSensitiveColumns（敏感列）

- Tid
- SchemaName / TableName / ColumnName（过滤条件）

### GetOpLog（操作日志）

- Tid
- StartTime / EndTime
- Module（登录/SQL/工单等）
- PageNumber / PageSize

### ListSQLExecAuditLog（SQL 审计日志）

- Tid
- StartTime / EndTime
- SearchName（操作人/SQL 关键词）
- DbId
- PageNumber / PageSize

## 元数据知识

### GetTableKnowledgeInfo（表业务知识）

- Tid
- TableGuid

### EditMetaKnowledgeAsset（编辑业务知识）

- Tid
- AssetType（TABLE / COLUMN）
- AssetId
- KnowledgeContent
