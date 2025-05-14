<!-- 顶部语言切换 -->

<p align="center">English | <a href="/doc/README-zh-cn.md">中文</a><br></p>


# AlibabaCloud DMS MCP Server

**AI-powered unified data management gateway** that supports connection to over 30+ data sources, serving as a multi-cloud universal data MCP Server to address cross-source data secure access in one-stop solution.

- Supports full Alibaba Cloud series: RDS, PolarDB, ADB series, Lindorm series, TableStore series, MaxCompute series.
- Supports mainstream databases/warehouses: MySQL, MariaDB, PostgreSQL, Oracle, SQLServer, Redis, MongoDB, StarRocks, Clickhouse, SelectDB, DB2, OceanBase, Gauss, BigQuery, etc.

<img src="images/architecture-0508.jpg" alt="Architecture" width="60%">

[//]: # (<img src="https://dms-static.oss-cn-hangzhou.aliyuncs.com/mcp-readme/architecture-0508.jpg" alt="Architecture" width="60%">)


---

## Core Features
Provides AI with a unified **data access layer** and **metadata access layer**, solving through standardized interfaces:
- Maintenance costs caused by data source fragmentation
- Compatibility issues between heterogeneous protocols
- Security risks from uncontrolled account permissions and non-auditable operations

Key features via MCP include:
- **NL2SQL**: Execute SQL via natural language to obtain data results
- **Code Generation**: Retrieve schema information through this service to generate DAO code or perform structural analysis
- **Data Retrieval**: Automatically route SQL to accurate data sources for business support
- **Security**: Fine-grained access control and auditability

---
## Tool List

### Metadata Related

#### addInstance: Add an instance to DMS. If the instance already exists, return the existing instance information.

- **db_user** (string, required): Username for connecting to the database.
- **db_password** (string, required): Password for connecting to the database.
- **instance_resource_id** (string, optional): Resource ID of the instance, typically assigned by the cloud service provider.
- **host** (string, optional): Connection address of the instance.
- **port** (string, optional): Connection port number of the instance.
- **region** (string, optional): Region where the instance is located (e.g., "cn-hangzhou").

#### getInstance: Retrieve instance details from DMS based on host and port information.

- **host** (string, required): Connection address of the instance.
- **port** (string, required): Connection port number of the instance.
- **sid** (string, optional): Required for Oracle-like databases, defaults to None.

#### searchDatabase: Search for databases in DMS based on schemaName.

- **search_key** (string, required): schemaName.
- **page_number** (integer, optional): Page number to retrieve (starting from 1), default is 1.
- **page_size** (integer, optional): Number of results per page (maximum 1000), default is 200.

#### getDatabase: Retrieve detailed information about a specific database from DMS.

- **host** (string, required): Connection address of the instance.
- **port** (string, required): Connection port number of the instance.
- **schema_name** (string, required): Database name.
- **sid** (string, optional): Required for Oracle-like databases, defaults to None.

#### listTable: Search for data tables in DMS based on databaseId and tableName.

- **database_id** (string, required): Database ID to limit the search scope (obtained via getDatabase).
- **search_name** (string, required): Non-empty string as a search keyword to match table names.
- **page_number** (integer, optional): Pagination page number (default: 1).
- **page_size** (integer, optional): Number of results per page (default: 200, maximum: 200).

#### getTableDetailInfo: Retrieve detailed metadata information for a specific data table, including field and index details.

- **table_guid** (string, required): Unique identifier for the table (format: dmsTableId.schemaName.tableName), obtained via searchTable or listTable.

---

### SQL Execution Related

#### executeScript: Execute an SQL script through DMS and return the results.

- **database_id** (string, required): DMS database ID (obtained via getDatabase).
- **script** (string, required): SQL script content to execute.

---

### NL2SQL Related

#### nl2sql: Convert natural language questions into executable SQL queries.

- **question** (string, required): Natural language question to convert into SQL.
- **database_id** (integer, required): DMS database ID (obtained via getDatabase).
- **knowledge** (string, optional): Additional context or database knowledge to assist SQL generation.



---

## Supported Data Sources
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

## Getting Started
### Option 1: Run from Source Code
#### Download the Code
```bash
git clone https://github.com/aliyun/alibabacloud-dms-mcp-server.git
```

#### Configure MCP Client
Add the following content to the configuration file:
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
### Option 2: Run via PyPI Package

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

For any questions or suggestions, join the [Alibaba Cloud DMS MCP Group](https://h5.dingtalk.com/circle/joinCircle.html?corpId=dinga0bc5ccf937dad26bc961a6cb783455b&token=2f373e6778dcde124e1d3f22119a325b&groupCode=v1,k1,NqFGaQek4YfYPXVECdBUwn+OtL3y7IHStAJIO0no1qY=&from=group&ext=%7B%22channel%22%3A%22QR_GROUP_NORMAL%22%2C%22extension%22%3A%7B%22groupCode%22%3A%22v1%2Ck1%2CNqFGaQek4YfYPXVECdBUwn%2BOtL3y7IHStAJIO0no1qY%3D%22%2C%22groupFrom%22%3A%22group%22%7D%2C%22inviteId%22%3A2823675041%2C%22orgId%22%3A784037757%2C%22shareType%22%3A%22GROUP%22%7D&origin=11) (DingTalk Group ID: 129600002740) .

<img src="images/ding-en.jpg" alt="DingTalk" width="40%">

[//]: # (<img src="http://dms-static.oss-cn-hangzhou.aliyuncs.com/mcp-readme/ding-en.jpg" alt="DingTalk" width="40%">)


## License
This project is licensed under the Apache 2.0 License.
