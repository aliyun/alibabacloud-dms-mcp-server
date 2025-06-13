<!-- 顶部语言切换 -->

<p align="center"><a href="../README.md">English</a> | 中文<br></p>

# AlibabaCloud DMS MCP Server

**AI 首选的统一数据管理网关，支持40多种数据源**连接的多云通用数据MCP Server，一站式解决**跨源数据安全访问**。

- 支持阿里云全系：RDS、PolarDB、ADB系列、Lindorm系列、TableStore系列、Maxcompute系列。
- 支持主流数据库/数仓：MySQL、MariaDB、PostgreSQL、Oracle、SQLServer、Redis、MongoDB、StarRocks、Clickhouse、SelectDB、DB2、OceanBase、Gauss、BigQuery等。

<img src="../images/architecture-0508.jpg" alt="Architecture" width="60%">

[//]: # (<img src="https://dms-static.oss-cn-hangzhou.aliyuncs.com/mcp-readme/architecture-0508.jpg" alt="Architecture" width="60%">)


---

## 核心特性
为大模型提供统一的**数据接入层**与**元数据访问层**，通过标准化接口解决：  
- 数据源碎片化导致的MCP Server维护成本  
- 异构协议间的兼容性问题  
- 账号权限不受控、操作无审计带来的安全问题  

同时，通过MCP将获得以下特性：  
- **NL2SQL**：通过自然语言执行SQL，获得数据结果  
- **代码生成**：通过该服务获取schema信息，生成DAO代码或进行结构分析  
- **取数**：通过SQL自动路由准确数据源获得数据，为上层业务提供数据支持  
- **安全**：精细的访问控制和可审计性 
- **数据迁移**：配置数据迁移任务

---
## 使用方式
DMS MCP Server 现在支持两种使用模式。

### 模式一：多实例模式
- 支持添加实例到DMS，可以访问多个数据库实例。
- 适用于需要管理和访问多个数据库实例的场景。
#### 场景示例：
你是公司的DBA，需要在生产、测试和开发等多个环境中管理和访问 MySQL、Oracle 和 PostgreSQL 等多种数据库实例。通过DMS MCP Server，可以实现对这些异构数据库的统一接入与集中管理。

**典型提问示例：**  
- 获取所有名称为test的数据库列表
- 获取 myHost:myPort 实例中 test_db 数据库的详细信息。
- test_db 数据库下有哪些表？ 
- 使用工具， 查询test_db 库的数据，回答“今天的用户访问量是多少？”


### 模式二：单数据库模式
- 通过在SERVER中配置 CONNECTION_STRING 参数（格式为 dbName@host:port），直接指定需要访问的数据库。
- 适用于专注一个数据库访问的场景。
#### 场景示例：
你是一个开发人员，只需要频繁访问一个固定的数据库（如 mydb@192.168.1.100:3306）进行开发测试。在 DMS MCP Server 的配置中设置一个 CONNECTION_STRING 参数，例如：
```ini
CONNECTION_STRING = mydb@192.168.1.100:3306
```
之后每次启动服务时，DMS MCP Server都会直接访问这个指定的数据库，无需切换实例。

**典型提问示例：**  
- 我有哪些表？
- 查看test_table 表的字段结构
- 获取test_table 表的前20条数据
- 使用工具，回答“今天的用户访问量是多少？”

---

## 工具清单
| 工具名称           | 描述                            | 适用模式                |
|------------------|-------------------------------|----------------------|
| addInstance      | 将阿里云实例添加到 DMS。                | 多实例模式              |
| listInstances      | 搜索DMS中的实例列表。 | 多实例模式              |
| getInstance      | 根据 host 和 port 获取实例详细信息。      | 多实例模式              |
| searchDatabase    | 根据 schemaName 搜索数据库。          | 多实例模式              |
| getDatabase      | 获取特定数据库的详细信息。                 | 多实例模式              |
| listTable        | 搜索指定数据库下的数据表。                 | 多实例模式 & 单数据库模式 |
| getTableDetailInfo | 获取特定数据库表的详细信息。                | 多实例模式 & 单数据库模式 |
| executeScript    | 执行 SQL 脚本并返回结果。               | 多实例模式 & 单数据库模式 |
| nl2sql           | 将自然语言问题转换为 SQL 查询。            | 多实例模式              |
| askDatabase      | 自然语言查询数据库（NL2SQL + 执行 SQL）。   | 单数据库模式            |
| configureDtsJob  | 配置DTS迁移任务                     | 多实例模式              |
| startDtsJob      | 启动DTS迁移任务                     | 多实例模式              |
| getDtsJob        | 查看DTS迁移任务详情                   | 多实例模式              |

<p> 详细工具列表请查阅：<a href="/doc/Tool-List-cn.md">工具清单</a><br></p>

---

## 支持的数据源
| DataSource/Tool       | **NL2SQL** *nlsql* | **Execute script** *executeScript* | **Show schema** *getTableDetailInfo* | **Access control** *default* | **Audit log** *default* |
|-----------------------|----------------|---------------------------------|--------------------------------------|-----------------------------|------------------------|
| MySQL                 | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |
| MariaDB               | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |
| PostgreSQL            | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |
| Oracle                | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |
| SQLServer             | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |
| Redis                 | ❌               | ❌                                | ✅                                    | ✅                           | ✅                      |
| MongoDB               | ❌               | ❌                                | ✅                                    | ✅                           | ✅                      |
| StarRocks             | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |
| Clickhouse            | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |
| SelectDB              | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |
| DB2                   | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |
| OceanBase             | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |
| Gauss                 | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |
| BigQuery              | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |
| PolarDB               | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |
| PolarDB-X             | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |
| AnalyticDB            | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |
| Lindorm               | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |
| TableStore            | ❌               | ❌                                | ✅                                    | ✅                           | ✅                      |
| Maxcompute            | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |
| Hologres              | ✅              | ✅                               | ✅                                    | ✅                           | ✅                      |

---
## 前提条件
- 已安装uv
- 已安装Python 3.10+
- 具有阿里云DMS访问权限(AliyunDMSFullAccess)的AK SK或者STS Token

---
## 准备工作
在通过DMS MCP访问托管在DMS的数据库实例之前，需要将对应的数据库实例录入至DMS中，并为实例开启 [安全托管](https://help.aliyun.com/zh/dms/product-overview/security-hosting)。

可以通过以下两种方式进行实例的添加：

**方法一：使用DMS MCP 提供的 `addInstance` 工具添加实例**

DMS MCP Server提供了 `addInstance` 工具，用于快速将实例添加到 DMS 中。

详情请见“工具清单”中的 `addInstance`工具描述。

**方法二：通过 DMS 控制台页面添加实例**

1 登录 [DMS 控制台](https://dms.aliyun.com/)。

2 在控制台首页左侧的数据库实例区域，单击**新增实例**图标。

3 在新增实例页面，录入实例信息（如实例地址、端口、用户名、密码）。

4 单击**提交**按钮完成实例添加。


---

## 快速开始

### 方案一 使用源码运行
#### 下载代码
```bash
git clone https://github.com/aliyun/alibabacloud-dms-mcp-server.git
```

#### 配置MCP客户端
在配置文件中添加以下内容：

**多实例模式**
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
**单数据库模式**
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


### 方案二 使用PyPI包运行
**多实例模式**
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
**单数据库模式**
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

如果您有使用问题或建议, 请加入[Alibaba Cloud DMS MCP讨论组](https://h5.dingtalk.com/circle/joinCircle.html?corpId=dinga0bc5ccf937dad26bc961a6cb783455b&token=2f373e6778dcde124e1d3f22119a325b&groupCode=v1,k1,NqFGaQek4YfYPXVECdBUwn+OtL3y7IHStAJIO0no1qY=&from=group&ext=%7B%22channel%22%3A%22QR_GROUP_NORMAL%22%2C%22extension%22%3A%7B%22groupCode%22%3A%22v1%2Ck1%2CNqFGaQek4YfYPXVECdBUwn%2BOtL3y7IHStAJIO0no1qY%3D%22%2C%22groupFrom%22%3A%22group%22%7D%2C%22inviteId%22%3A2823675041%2C%22orgId%22%3A784037757%2C%22shareType%22%3A%22GROUP%22%7D&origin=11) (钉钉群号:129600002740) 进行讨论.

<img src="../images/ding-en.jpg" alt="DingTalk" width="40%">

[//]: # (<img src="http://dms-static.oss-cn-hangzhou.aliyuncs.com/mcp-readme/ding-zh-cn.jpg" alt="DingTalk" width="60%">)



## License
This project is licensed under the Apache 2.0 License.
