
### 元数据相关
#### addInstance：将阿里云实例添加到 DMS。

- **db_user** (字符串, 必需): 用于连接数据库的用户名。
- **db_password** (字符串, 必需): 用于连接数据库的密码。
- **instance_resource_id** (字符串, 可选): 实例的资源 ID，通常由云服务提供商分配。
- **host** (字符串, 可选): 实例的连接地址。
- **port** (字符串, 可选): 实例的连接端口号。
- **region** (字符串, 可选): 实例所在的区域（例如 "cn-hangzhou"）。

#### listInstances：搜索DMS中的实例列表。

- **search_key** (字符串, 可选): 搜索关键词，例如实例地址、实例别名等。
- **db_type** (字符串, 可选): 数据库类型，例如mysql、oracle、postgresql等。
- **env_type** (字符串, 可选): 实例环境类型，例如product（生产）、dev（开发）、test（测试）等。

#### getInstance：根据 host 和 port 信息从 DMS 中获取实例详细信息。

- **host** (字符串, 必需): 实例的连接地址。
- **port** (字符串, 必需): 实例的连接端口号。
- **sid** (字符串, 可选): Oracle 类数据库所需，默认为 None。

#### searchDatabase：根据 schemaName 在 DMS 中搜索数据库。

- **search_key** (字符串, 必需): schemaName。
- **page_number** (整数, 可选): 要检索的页码（从 1 开始），默认为 1。
- **page_size** (整数, 可选): 每页的结果数量，最多 1000，默认为 200。

#### getDatabase：从 DMS 中获取特定数据库的详细信息。

- **host** (字符串, 必需): 实例的连接地址。
- **port** (字符串, 必需): 实例的连接端口号。
- **schema_name** (字符串, 必需): 数据库名。
- **sid** (字符串, 可选): Oracle 类数据库所需，默认为 None。

#### listTable：根据 databaseId 和 tableName 在 DMS 中搜索数据表。

- **database_id** (字符串, 必需): 用于限定搜索范围的数据库 ID（可通过 getDatabase 工具获取）。
- **search_name** (字符串, 可选): 作为搜索关键词的字符串，用于匹配表名。
- **page_number** (整数, 可选): 分页页码（默认：1）。
- **page_size** (整数, 可选): 每页结果数量（默认：200，最大：200）。

#### getTableDetailInfo：获取特定数据表的详细元数据信息，包括字段和索引详情。

- **table_guid** (字符串, 必需): 表的唯一标识符（格式：dmsTableId.schemaName.tableName），可通过 searchTable 或 listTable 工具获取。

---

### SQL 执行相关

#### executeScript：通过 DMS 执行 SQL 脚本并返回结果。

- **database_id** (字符串, 必需): DMS 数据库 ID，可通过 getDatabase 工具获取。
- **script** (字符串, 必需): 要执行的 SQL 脚本内容。

#### createDataChangeOrder：在 DMS 中创建数据变更工单。

- **database_id** (字符串, 必需): DMS 数据库 ID，可通过 getDatabase 工具获取。
- **script** (字符串, 必需): 要执行的 SQL 脚本内容。

#### getOrderInfo：获取 DMS 工单详情。

- **order_id** (字符串, 必需): DMS 中的工单ID。

#### submitOrderApproval：提交 DMS 工单审批。

- **order_id** (字符串, 必需): DMS 中的工单ID。


---

### NL2SQL 相关

#### generateSql：将自然语言问题转换为可执行的 SQL 查询。

- **question** (字符串, 必需): 需要转换为 SQL 的自然语言问题。
- **database_id** (整数, 必需): DMS 数据库 ID，可通过 getDatabase 工具获取。
- **knowledge** (字符串, 可选): 用于辅助 SQL 生成的额外上下文或数据库知识。
- **model** (字符串, 可选): 指定的大模型类型，目前可使用通义千问系列的模型。


#### askDatabase: 通过自然语言问题直接获取数据库执行结果。
- **question** (字符串, 必需): 需要转换为 SQL 的自然语言问题。
- **knowledge** (字符串, 可选): 用于辅助 SQL 生成的额外上下文或数据库知识。
- **model** (字符串, 可选): 指定的大模型类型，目前可使用通义千问系列的模型。

---

### SQL助手 相关

#### fixSql：SQL修复。

- **database_id** (整数, 必需): DMS 数据库 ID，可通过 getDatabase 工具获取。
- **sql** (字符串, 必需): 需要修复的SQL。
- **error** (字符串, 必需): SQL的报错信息。
- **question** (字符串, 可选): 辅助描述信息。
- **model** (字符串, 可选): 指定的大模型类型，目前可使用通义千问系列的模型。


#### answerSqlSyntax：SQL语法回答。

- **database_id** (整数, 必需): DMS 数据库 ID，可通过 getDatabase 工具获取。
- **question** (字符串, 必需): 问题。
- **model** (字符串, 可选): 指定的大模型类型，目前可使用通义千问系列的模型。

#### optimizeSql：SQL优化。

- **database_id** (整数, 必需): DMS 数据库 ID，可通过 getDatabase 工具获取。
- **sql** (字符串, 必需): 待优化的SQL。
- **question** (字符串, 可选): 辅助描述信息。
- **model** (字符串, 可选): 指定的大模型类型，目前可使用通义千问系列的模型。