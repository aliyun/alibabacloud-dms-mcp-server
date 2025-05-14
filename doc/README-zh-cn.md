<!-- 顶部语言切换 -->

<p align="center"><a href="../README.md">English</a> | 中文<br></p>

# AlibabaCloud DMS MCP Server

**AI 首选的统一数据管理网关，支持30多种数据源**连接的多云通用数据MCP Server，一站式解决**跨源数据安全访问**。

- 支持阿里云全系：RDS、PolarDB、ADB系列、Lindorm系列、TableStore系列、Maxcompute系列。
- 支持主流数据库/数仓：MySQL、MariaDB、PostgreSQL、Oracle、SQLServer、Redis、MongoDB、StarRocks、Clickhouse、SelectDB、DB2、OceanBase、Gauss、BigQuery等。

<img src="../images/architecture-0508.jpg" alt="Architecture" width="60%">

[//]: # (<img src="https://dms-static.oss-cn-hangzhou.aliyuncs.com/mcp-readme/architecture-0508.jpg" alt="Architecture" width="60%">)


---

## 核心特性
为AI提供统一的**数据接入层**与**元数据访问层**，通过标准化接口解决：  
- 数据源碎片化导致的MCP Server维护成本  
- 异构协议间的兼容性问题  
- 账号权限不受控、操作无审计带来的安全问题  

同时，通过MCP将获得以下特性：  
- **NL2SQL**：通过自然语言执行SQL，获得数据结果  
- **代码生成**：通过该服务获取schema信息，生成DAO代码或进行结构分析  
- **取数**：通过SQL自动路由准确数据源获得数据，为上层业务提供数据支持  
- **安全**：精细的访问控制和可审计性  


## 工具清单

### 元数据相关
#### addInstance：将实例添加到 DMS。如果实例已存在，则返回已有实例信息。

- **db_user** (字符串, 必需): 用于连接数据库的用户名。
- **db_password** (字符串, 必需): 用于连接数据库的密码。
- **instance_resource_id** (字符串, 可选): 实例的资源 ID，通常由云服务提供商分配。
- **host** (字符串, 可选): 实例的连接地址。
- **port** (字符串, 可选): 实例的连接端口号。
- **region** (字符串, 可选): 实例所在的区域（例如 "cn-hangzhou"）。

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
- **search_name** (字符串, 必需): 作为搜索关键词的非空字符串，用于匹配表名。
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

---

## 支持的数据源
| DataSource/Tool       | **NL2SQL** *nlsql* | **Execute script** *executeScript* | **Show schema** *getTableDetailInfo* | **Access control** *default* | **Audit log** *default* |
|-----------------------|--------------------|------------------------------------|--------------------------------------|-----------------------------|------------------------|
| MySQL                 | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| MariaDB               | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| PostgreSQL            | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| Oracle                | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| SQLServer             | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| Redis                 | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| MongoDB               | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| StarRocks             | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| Clickhouse            | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| SelectDB              | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| DB2                   | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| OceanBase             | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| Gauss                 | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| BigQuery              | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| PolarDB               | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| PolarDB-X             | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| AnalyticDB            | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| Lindorm               | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| TableStore            | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| Maxcompute            | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |
| Hologres              | ✅                  | ✅                                  | ✅                                    | ✅                           | ✅                      |

---

## 快速开始

### 方案一 使用源码运行
#### 下载代码
```bash
git clone https://github.com/aliyun/alibabacloud-dms-mcp-server.git
```

#### 配置MCP客户端
在配置文件中添加以下内容：
```json
"mcpServers": {
  "dms-mcp-server": {
    "command": "uv",
    "args": [
      "--directory",
      "/path/to/alibabacloud-dms-mcp-server/src/alibabacloud_dms_mcp_server",
      "run",
      "server.py"
    ],
    "env": {
      "ALIBABA_CLOUD_ACCESS_KEY_ID": "access_id",
      "ALIBABA_CLOUD_ACCESS_KEY_SECRET": "access_key",
      "ALIBABA_CLOUD_SECURITY_TOKEN": "sts_security_token optional, required when using STS Token"
    }
  }
}
```

### 方案二 使用PyPI包运行
```json
"mcpServers": {
  "dms-mcp-server": {
    "command": "uvx",
    "args": [
      "alibabacloud-dms-mcp-server@latest"
    ],
    "env": {
      "ALIBABA_CLOUD_ACCESS_KEY_ID": "access_id",
      "ALIBABA_CLOUD_ACCESS_KEY_SECRET": "access_key",
      "ALIBABA_CLOUD_SECURITY_TOKEN": "sts_security_token optional, required when using STS Token"
    }
  }
}
```

---

## Contact us

如果您有使用问题或建议, 请加入[Alibaba Cloud DMS MCP讨论组](https://h5.dingtalk.com/circle/joinCircle.html?corpId=dinga0bc5ccf937dad26bc961a6cb783455b&token=2f373e6778dcde124e1d3f22119a325b&groupCode=v1,k1,NqFGaQek4YfYPXVECdBUwn+OtL3y7IHStAJIO0no1qY=&from=group&ext=%7B%22channel%22%3A%22QR_GROUP_NORMAL%22%2C%22extension%22%3A%7B%22groupCode%22%3A%22v1%2Ck1%2CNqFGaQek4YfYPXVECdBUwn%2BOtL3y7IHStAJIO0no1qY%3D%22%2C%22groupFrom%22%3A%22group%22%7D%2C%22inviteId%22%3A2823675041%2C%22orgId%22%3A784037757%2C%22shareType%22%3A%22GROUP%22%7D&origin=11) (钉钉群号:129600002740) 进行讨论.

<img src="../images/ding-en.jpg" alt="DingTalk" width="40%">

[//]: # (<img src="http://dms-static.oss-cn-hangzhou.aliyuncs.com/mcp-readme/ding-zh-cn.jpg" alt="DingTalk" width="60%">)



## License
This project is licensed under the Apache 2.0 License.
