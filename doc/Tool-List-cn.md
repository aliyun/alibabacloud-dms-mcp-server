
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

---

### NL2SQL 相关

#### nl2sql：将自然语言问题转换为可执行的 SQL 查询。

- **question** (字符串, 必需): 需要转换为 SQL 的自然语言问题。
- **database_id** (整数, 必需): DMS 数据库 ID，可通过 getDatabase 工具获取。
- **knowledge** (字符串, 可选): 用于辅助 SQL 生成的额外上下文或数据库知识。

#### askDatabase: 通过自然语言问题直接获取数据库执行结果
- **question** (字符串, 必需): 需要转换为 SQL 的自然语言问题。
- **knowledge** (字符串, 可选): 用于辅助 SQL 生成的额外上下文或数据库知识。
---
### 数据迁移相关

#### configureDtsJob: 配置 DTS 数据迁移任务，将一个 RDS-MySQL 中的数据迁移到另外一个 RDS-MySQL 中。
- **region_id** (字符串, 必需): 实例所在的区域（例如：杭州 `"cn-hangzhou"`，北京 `"cn-beijing"`）。
- **job_type** (字符串, 必需): DTS 任务类型（例如：同步任务 `"SYNC"`，迁移任务 `"MIGRATION"`）。
- **source_endpoint_region** (字符串, 必需): 源数据库所在的区域（例如：杭州 `"cn-hangzhou"`，北京 `"cn-beijing"`）。
- **source_endpoint_instance_type** (字符串, 必需): 源数据库实例类型（例如：`"RDS"`）。
- **source_endpoint_engine_name** (字符串, 必需): 源数据库引擎类型（例如：`"MySQL"`）。
- **source_endpoint_instance_id** (字符串, 必需): 源数据库实例 ID（例如：`"rm-xxx"`）。
- **source_endpoint_user_name** (字符串, 必需): 源数据库连接用户名。
- **source_endpoint_password** (字符串, 必需): 源数据库连接密码。
- **destination_endpoint_region** (字符串, 必需): 目标数据库所在的区域（例如：杭州 `"cn-hangzhou"`，北京 `"cn-beijing"`）。
- **destination_endpoint_instance_type** (字符串, 必需): 目标数据库实例类型（例如：`"RDS"`）。
- **destination_endpoint_engine_name** (字符串, 必需): 目标数据库引擎类型（例如：`"MySQL"`）。
- **destination_endpoint_instance_id** (字符串, 必需): 目标数据库实例 ID（例如：`"rm-xxx"`）。
- **destination_endpoint_user_name** (字符串, 必需): 目标数据库连接用户名。
- **destination_endpoint_password** (字符串, 必需): 目标数据库连接密码。
- **db_list** (字符串, 必需): 迁移对象，JSON 字符串格式：
  示例1：迁移 `dtstest` 数据库，`db_list` 为 `{"dtstest":{"name":"dtstest","all":true}}`；
  示例2：迁移 `dtstest` 数据库下的 `task01` 表，`db_list` 为 `{"dtstest":{"name":"dtstest","all":false,"Table":{"task01":{"name":"task01","all":true}}}}`；
  示例3：迁移 `dtstest` 数据库下的 `task01`、`task02` 表，`db_list` 为 `{"dtstest":{"name":"dtstest","all":false,"Table":{"task01":{"name":"task01","all":true},"task02":{"name":"task02","all":true}}}}`。

#### startDtsJob: 启动 DTS 迁移任务。
- **region_id** (字符串, 必需): 实例所在的区域（例如：杭州 `"cn-hangzhou"`，北京 `"cn-beijing"`）。
- **dts_job_id** (字符串, 必需): DTS 任务 ID。

#### getDtsJob: 获取 DTS 迁移任务详情信息。
- **region_id** (字符串, 必需): 实例所在的区域（例如：杭州 `"cn-hangzhou"`，北京 `"cn-beijing"`）。
- **dts_job_id** (字符串, 必需): DTS 任务 ID。

---
