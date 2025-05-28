<!-- 顶部语言切换 -->

<p align="center">English | <a href="./README-dts-zh-cn.md">中文</a><br></p>


# AlibabaCloud DTS MCP Server

**DTS MCP Server provides the capability for AI to rapidly configure data migration services.**。Alibaba Cloud Data Transmission Service (DTS) is a real-time data streaming service. DTS supports data transmission between data sources such as relational database management system (RDBMS) databases, NoSQL databases, and online analytical processing (OLAP) databases. DTS provides the data synchronization, data migration, change tracking, data integration, and data processing features. This allows you to manage data within a secure, scalable, and high-availability architecture.

---

## Core Features
Enable AI to create **DTS migration tasks** through natural language descriptions, including the following capabilities:
- Create migration job：configureDtsJob
- Start migration job：startDtsJob
- Get migration job detail information：getDtsJob

---
## Tool List

### Metadata Related

#### configureDtsJob - Configure a dts job, migrate data from one RDS-MySQL to another RDS-MySQL.
- **region_id** (string, required): The region id of the dts job (e.g., 'cn-hangzhou', 'cn-beijing').
- **job_type** (string, required): The type of job (synchronization job: SYNC, migration job: MIGRATION, data check job: CHECK).
- **source_endpoint_region** (string, required): The source endpoint region ID (e.g., 'cn-hangzhou', 'cn-beijing').
- **source_endpoint_instance_type** (string, required): The source endpoint instance type (RDS, ECS, EXPRESS, CEN, DG).
- **source_endpoint_engine_name** (string, required): The source endpoint engine name (MySQL, PostgreSQL, SQLServer).
- **source_endpoint_instance_id** (string, required): The source endpoint instance ID (e.g., 'rm-xxx').
- **source_endpoint_user_name** (string, required): The source endpoint user name.
- **source_endpoint_password** (string, required): The source endpoint password.
- **destination_endpoint_region** (string, required): The destination endpoint region ID (e.g., 'cn-hangzhou', 'cn-beijing').
- **destination_endpoint_instance_type** (string, required): The destination endpoint instance type (RDS, ECS, EXPRESS, CEN, DG).
- **destination_endpoint_engine_name** (string, required): The destination endpoint engine name (MySQL, PostgreSQL, SQLServer).
- **destination_endpoint_instance_id** (string, required): The destination endpoint instance ID (e.g., 'rm-xxx').
- **destination_endpoint_user_name** (string, required): The destination endpoint user name.
- **destination_endpoint_password** (string, required): The destination endpoint password.
- **db_list** (string, required): The database objects in JSON format, example 1: migration dtstest database, db_list should like {"dtstest":{"name":"dtstest","all":true}}; example 2: migration one table task01 in dtstest database, db_list should like {"dtstest":{"name":"dtstest","all":false,"Table":{"task01":{"name":"task01","all":true}}}}; example 3: migration two tables task01 and task02 in dtstest database, db_list should like {"dtstest":{"name":"dtstest","all":false,"Table":{"task01":{"name":"task01","all":true},"task02":{"name":"task02","all":true}}}}.

#### startDtsJob - 启动DTS迁移任务
- **region_id** (string, required): The region id of the dts job (e.g., 'cn-hangzhou', 'cn-beijing').
- **dts_job_id** (string, required): The job id of the dts job.

#### getDtsJob - 获取DTS迁移任务详情信息
- **region_id** (string, required): The region id of the dts job (e.g., 'cn-hangzhou', 'cn-beijing').
- **dts_job_id** (string, required): The job id of the dts job.

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

For any questions or suggestions, join the[Alibaba Cloud DMS MCP Group](https://h5.dingtalk.com/circle/joinCircle.html?corpId=dinga0bc5ccf937dad26bc961a6cb783455b&token=2f373e6778dcde124e1d3f22119a325b&groupCode=v1,k1,NqFGaQek4YfYPXVECdBUwn+OtL3y7IHStAJIO0no1qY=&from=group&ext=%7B%22channel%22%3A%22QR_GROUP_NORMAL%22%2C%22extension%22%3A%7B%22groupCode%22%3A%22v1%2Ck1%2CNqFGaQek4YfYPXVECdBUwn%2BOtL3y7IHStAJIO0no1qY%3D%22%2C%22groupFrom%22%3A%22group%22%7D%2C%22inviteId%22%3A2823675041%2C%22orgId%22%3A784037757%2C%22shareType%22%3A%22GROUP%22%7D&origin=11) (DingTalk Group ID: 129600002740) .

<img src="../images/ding-en.jpg" alt="Ding" width="40%">

[//]: # (<img src="http://dms-static.oss-cn-hangzhou.aliyuncs.com/mcp-readme/ding-en.jpg" alt="Ding" width="40%">)


## License
This project is licensed under the Apache 2.0 License.
