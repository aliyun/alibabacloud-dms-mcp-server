<!-- 顶部语言切换 -->

<p align="center">English | <a href="/doc/README-zh-cn.md">中文</a><br></p>


# AlibabaCloud DMS MCP Server

**AI-powered unified data management gateway** that supports connection to over 30+ data sources, serving as a multi-cloud universal data MCP Server to address cross-source data secure access in one-stop solution.

- Supports full Alibaba Cloud series: RDS, PolarDB, ADB series, Lindorm series, TableStore series, MaxCompute series.
- Supports mainstream databases/warehouses: MySQL, MariaDB, PostgreSQL, Oracle, SQLServer, Redis, MongoDB, StarRocks, Clickhouse, SelectDB, DB2, OceanBase, Gauss, BigQuery, etc.

<a href="https://glama.ai/mcp/servers/@aliyun/alibabacloud-dms-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@aliyun/alibabacloud-dms-mcp-server/badge" alt="Alibaba Cloud DMS Server MCP server" />
</a>

<img src="images/architecture-0508.jpg" alt="Ding" width="60%">

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
### Download the Code
```bash
git clone https://github.com/aliyun/alibabacloud-dms-mcp-server.git
```

### Configure MCP Client
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

---

## Contact us

For any questions or suggestions, join the[Alibaba Cloud DMS MCP Group](https://h5.dingtalk.com/circle/joinCircle.html?corpId=dinga0bc5ccf937dad26bc961a6cb783455b&token=2f373e6778dcde124e1d3f22119a325b&groupCode=v1,k1,NqFGaQek4YfYPXVECdBUwn+OtL3y7IHStAJIO0no1qY=&from=group&ext=%7B%22channel%22%3A%22QR_GROUP_NORMAL%22%2C%22extension%22%3A%7B%22groupCode%22%3A%22v1%2Ck1%2CNqFGaQek4YfYPXVECdBUwn%2BOtL3y7IHStAJIO0no1qY%3D%22%2C%22groupFrom%22%3A%22group%22%7D%2C%22inviteId%22%3A2823675041%2C%22orgId%22%3A784037757%2C%22shareType%22%3A%22GROUP%22%7D&origin=11) (DingTalk Group ID: 129600002740) .

<img src="images/ding-en.jpg" alt="Ding" width="40%">


## License
This project is licensed under the Apache 2.0 License.