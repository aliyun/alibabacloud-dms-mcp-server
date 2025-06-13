<!-- 顶部语言切换 -->

<p align="center">English | <a href="/doc/README-zh-cn.md">中文</a><br></p>


# AlibabaCloud DMS MCP Server

**AI-powered unified data management gateway** that supports connection to over 40+ data sources, serving as a multi-cloud universal data MCP Server to address cross-source data secure access in one-stop solution.

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
- **Data Migration**: Configure data migration tasks

---

## Usage Methods  
DMS MCP Server currently supports two usage modes.

### Mode One: Multi-instance Mode  
- Supports adding instances to DMS, allowing access to multiple database instances.  
- Suitable for scenarios where managing and accessing multiple database instances is required.  
#### Scenario Example:  
You are a company DBA who needs to manage and access various types of database instances (e.g., MySQL, Oracle, PostgreSQL) in production, test, and development environments. With DMS MCP Server, you can achieve unified access and centralized management of these heterogeneous databases.  

**Typical Question Examples:**  
- Get a list of all databases named `test`.  
- Retrieve details of the `test_db` database from the `myHost:myPort` instance.  
- What tables are in the `test_db` database?  
- Use a tool to query data from the `test_db` database and answer: "What is today's user traffic?"

### Mode Two: Single Database Mode  
- Directly specify the target database by configuring the `CONNECTION_STRING` parameter in the server (format: `dbName@host:port`).  
- Suitable for scenarios that focus on accessing a single database.  
#### Scenario Example:  
You are a developer who frequently accesses a fixed database (e.g., `mydb@192.168.1.100:3306`) for development and testing. Set the `CONNECTION_STRING` parameter in the DMS MCP Server configuration as follows:  
```ini
CONNECTION_STRING = mydb@192.168.1.100:3306
```
Afterward, every time the service starts, the DMS MCP Server will directly access this specified database without needing to switch instances.

**Typical Question Examples:**  
- What tables do I have?  
- Show the field structure of the `test_table` table.  
- Retrieve the first 20 rows from the `test_table` table.  
- Use a tool to answer: "What is today's user traffic?"

---
## Tool List  
| Tool Name          | Description                                                                                                               | Applicable Mode                |
|--------------------|---------------------------------------------------------------------------------------------------------------------------|-------------------------------|
| addInstance        | Adds an instance to DMS. Only Aliyun instances are supported. | Multi-instance Mode            |
| listInstances      | Search for instances from DMS.                                                                                            | Multi-instance Mode            |
| getInstance        | Retrieves detailed information about an instance based on host and port.                                                  | Multi-instance Mode            |
| searchDatabase     | Searches databases based on schemaName.                                                                                   | Multi-instance Mode            |
| getDatabase        | Retrieves detailed information about a specific database.                                                                 | Multi-instance Mode            |
| listTable          | Lists tables under a specified database.                                                                                  | Multi-instance Mode & Single Database Mode |
| getTableDetailInfo | Retrieves detailed information about a specific table.                                                                    | Multi-instance Mode & Single Database Mode |
| executeScript      | Executes an SQL script and returns the result.                                                                            | Multi-instance Mode & Single Database Mode |
| nl2sql             | Converts natural language questions into SQL queries.                                                                     | Multi-instance Mode            |
| askDatabase        | Natural language querying of a database (NL2SQL + execute SQL).                                                           | Single Database Mode           |
| configureDtsJob    | Configures a DTS migration task                                                                                           | Multi-instance Mode            |
| startDtsJob        | Starts a DTS migration task                                                                                               | Multi-instance Mode            |
| getDtsJob          | Views details of a DTS migration task                                                                                     | Multi-instance Mode            |

<p> For a full list of tools, please refer to: <a href="/doc/Tool-List-en.md">Tool List</a><br></p>



---

## Supported Data Sources
| DataSource/Tool       | **NL2SQL** *nlsql* | **Execute script** *executeScript* | **Show schema** *getTableDetailInfo* | **Access control** *default* | **Audit log** *default* |
|-----------------------|-----------------|---------------------------------|--------------------------------------|-----------------------------|------------------------|
| MySQL                 | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |
| MariaDB               | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |
| PostgreSQL            | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |
| Oracle                | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |
| SQLServer             | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |
| Redis                 | ❌               | ❌                                | ✅                                    | ✅                           | ✅                      |
| MongoDB               | ❌               | ❌                                | ✅                                    | ✅                           | ✅                      |
| StarRocks             | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |
| Clickhouse            | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |
| SelectDB              | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |
| DB2                   | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |
| OceanBase             | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |
| Gauss                 | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |
| BigQuery              | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |
| PolarDB               | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |
| PolarDB-X             | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |
| AnalyticDB            | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |
| Lindorm               | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |
| TableStore            | ❌               | ❌                                | ✅                                    | ✅                           | ✅                      |
| Maxcompute            | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |
| Hologres              | ✅               | ✅                               | ✅                                    | ✅                           | ✅                      |

---
## Prerequisites  
- uv is installed  
- Python 3.10+ is installed  
- An AK/SK or STS Token with access rights to Alibaba Cloud DMS(AliyunDMSFullAccess)

---
## Pre-configuration  
Before accessing a database instance via DMS, you must first add the instance to DMS.  

There are two methods to add an instance:

**Method One: Use the `addInstance` tool provided by DMS MCP to add an instance**  
The DMS MCP Server provides the `addInstance` tool for quickly adding an instance to DMS.  
For more details, see the description of the `addInstance` tool in the "Tool List."  

**Method Two: Add an instance via the DMS console**  
1. Log in to the [DMS Console](https://dms.aliyun.com/).  
2. On the home page of the console, click the **Add Instance** icon in the database instance area on the left.  
3. On the Add Instance page, enter the instance information (e.g., instance address, port, username, password).  
4. Click **Submit** to complete the instance addition.  
---



## Getting Started
### Option 1: Run from Source Code
#### Download the Code
```bash
git clone https://github.com/aliyun/alibabacloud-dms-mcp-server.git
```

#### Configure MCP Client
Add the following content to the configuration file:

**Multi-instance Mode**
```json
{
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
}
```

**Single Database Mode**
```json
{
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
        "ALIBABA_CLOUD_SECURITY_TOKEN": "sts_security_token optional, required when using STS Token",
        "CONNECTION_STRING": "dbName@host:port"
      }
    }
  }
}
```
### Option 2: Run via PyPI Package
**Multi-instance Mode**
```json
{
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
}
```
**Single Database Mode**
```json
{
  "mcpServers": {
    "dms-mcp-server": {
      "command": "uvx",
      "args": [
        "alibabacloud-dms-mcp-server@latest"
      ],
      "env": {
        "ALIBABA_CLOUD_ACCESS_KEY_ID": "access_id",
        "ALIBABA_CLOUD_ACCESS_KEY_SECRET": "access_key",
        "ALIBABA_CLOUD_SECURITY_TOKEN": "sts_security_token optional, required when using STS Token",
        "CONNECTION_STRING": "dbName@host:port"
      }
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
