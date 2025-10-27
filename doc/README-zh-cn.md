<!-- 顶部语言切换 -->

<p align="center"><a href="../README.md">English</a> | 中文<br></p>

# AlibabaCloud DMS MCP Server

**AI时代的数据安全访问网关 ｜智能问数引擎 ｜ 支持40+数据源**

---

## 核心特性
**安全访问**
- **账号密码安全托管**：安全管理数据库账号密码，无需人工维护，有效防止敏感信息泄露。
- **支持内网访问**：提供内网访问数据库能力，数据不出域，有效保障数据安全与隐私。
- **细粒度权限管控**：支持实例、库、表、字段及行级别的精细化访问控制，精准限制调用方权限，杜绝越权操作，保障数据安全。
- **高危SQL识别与拦截**：内置丰富的规则引擎，实时识别并拦截潜在高危SQL，防范安全风险。
- **SQL审计追踪**：记录所有SQL操作日志，支持完整追溯与合规审计，满足监管要求。

**智能问数**
- **内置NL2SQL算法**：基于输入的自然语言问题，智能匹配数据表，理解表中业务含义，生成并执行SQL查询，快速获取结果。
- **个性化知识库**：内置元数据和问数[知识库](https://help.aliyun.com/zh/dms/knowledge-base-management?)，支持自定义业务知识和查询模式，打造贴合业务场景的专属智能问数能力。

**多数据源支持**
- **广泛数据源支持**：支持40多种主流数据库/数仓类型，实现多源数据统一接入和访问。
- **多环境统一管理**：支持开发、测试、生产等不同环境下的数据库实例集中管理，提升运维效率。
- **多平台无缝集成**：覆盖阿里云、AWS等主流云平台以及自建数据库/数仓，有效降低维护成本。


---

## 支持生态

- 支持阿里云全系数据源：RDS、PolarDB、ADB系列、Lindorm系列、TableStore系列、Maxcompute系列。
- 支持主流数据库/数仓：MySQL、MariaDB、PostgreSQL、Oracle、SQLServer、Redis、MongoDB、StarRocks、Clickhouse、SelectDB、DB2、OceanBase、Gauss、BigQuery等。

---

## 核心架构
<img src="../images/architecture-0508.jpg" alt="Architecture" width="60%">

[//]: # (<img src="https://dms-static.oss-cn-hangzhou.aliyuncs.com/mcp-readme/architecture-0508.jpg" alt="Architecture" width="60%">)


---
## 使用方式
DMS MCP Server 支持两种使用模式。

### 模式一：多实例模式
- 支持添加实例到DMS，可以访问多个数据库实例。
- 适用于需要管理和访问多个数据库实例的场景。
#### 场景示例：
你是公司的DBA，需要在生产、测试和开发等多个环境中管理和访问 MySQL、Oracle 和 PostgreSQL 等多种数据库实例。通过DMS MCP Server，可以实现对这些异构数据源的统一接入与集中管理。

**典型提问示例：**  
- 我有哪些生产环境的实例？
- 获取所有名称为test的数据库列表
- 获取 myHost:myPort 实例中 test_db 数据库的详细信息。
- test_db 数据库下有哪些表？ 
- 使用工具， 查询test_db 库的数据，回答“今天的用户访问量是多少？”


### 模式二：单数据库模式
- 通过在SERVER中配置 CONNECTION_STRING 参数（格式为 dbName@host:port），直接指定需要访问的数据库。
- 适用于专注一个数据库访问的场景。
#### 场景示例1：
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


#### 场景示例2：
你是一家电商公司的数据分析师，需要频繁查询和分析订单、用户、商品等业务数据。公司的核心业务数据库位于 ecommerce@10.20.30.40:3306。

在DMS MCP Server中设置如下参数：
```ini
CONNECTION_STRING = ecommerce@10.20.30.40:3306
```

只需用自然语言提问，DMS MCP 即可将问题解析为 SQL 并返回结果。


**典型提问示例：** 
- 今天的订单总数是多少？
- 各个省份的订单数量排名如何？
- 过去7天内，每天的新增用户数是多少？
- 哪个商品类别的销售额最高？

---

## 工具清单
| 工具名称               | 描述                         | 适用模式                |
|--------------------|----------------------------|----------------------|
| addInstance        | 将阿里云实例添加到 DMS              | 多实例模式              |
| listInstances      | 搜索DMS中的实例列表                | 多实例模式              |
| getInstance        | 根据 host 和 port 获取实例详细信息    | 多实例模式              |
| searchDatabase     | 根据 schemaName 搜索数据库        | 多实例模式              |
| getDatabase        | 获取特定数据库的详细信息               | 多实例模式              |
| listTable          | 搜索指定数据库下的数据表               | 多实例模式 & 单数据库模式 |
| getTableDetailInfo | 获取特定数据库表的详细信息              | 多实例模式 & 单数据库模式 |
| executeScript      | 执行 SQL 脚本并返回结果             | 多实例模式 & 单数据库模式 |
| createDataChangeOrder      | 创建数据变更工单                   | 多实例模式 & 单数据库模式 |
| getOrderInfo      | 获取工单详情                     | 多实例模式 & 单数据库模式 |
| submitOrderApproval      | 提交工单审批                     | 多实例模式 & 单数据库模式 |
| generateSql        | 将自然语言问题转换为 SQL 查询          | 多实例模式              |
| askDatabase        | 自然语言查询数据库（NL2SQL + 执行 SQL） | 单数据库模式            |
| fixSql    | SQL修复                      | 多实例模式 & 单数据库模式              |
| answerSqlSyntax        | SQL语法回答                    | 多实例模式 & 单数据库模式              |
| optimizeSql          | SQL优化                      | 多实例模式 & 单数据库模式              |

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
- 已安装[uv](https://docs.astral.sh/uv/getting-started/installation/)
- 已安装Python 3.10+
- 具有阿里云DMS访问权限(AliyunDMSFullAccess)的[AK SK](https://help.aliyun.com/zh/ram/user-guide/view-the-accesskey-pairs-of-a-ram-user)或者[STS Token](https://help.aliyun.com/zh/ram/product-overview/what-is-sts)，添加权限操作，请参见[授权管理](https://help.aliyun.com/zh/ram/user-guide/authorization-management/)

---
## 准备工作
在通过DMS MCP访问托管在DMS的数据源之前，需要将对应的数据源录入至DMS中，并为实例开启 [安全托管](https://help.aliyun.com/zh/dms/product-overview/security-hosting)。

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
