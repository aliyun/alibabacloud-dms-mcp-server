<!-- 顶部语言切换 -->

<p align="center"><a href="./README-dts-en.md">English</a> | 中文<br></p>

# AlibabaCloud DTS MCP Server

**DTS MCP Server为AI提供快速配置数据迁移服务的能力**。数据传输服务DTS（Data Transmission Service）是阿里云提供的实时数据流服务，支持关系型数据库（RDBMS）、非关系型的数据库（NoSQL）、数据多维分析（OLAP）等数据源间的数据交互，集数据同步、迁移、订阅、集成、加工于一体，助您构建安全、可扩展、高可用的数据架构。

---

## 核心特性
为AI提供通过自然语言描述**创建DTS数据迁移任务**的能力，包含如下功能：
- 创建1个DTS迁移任务：configureDtsJob
- 启动DTS任务：startDtsJob
- 查看DTS任务详情：getDtsJob

## 工具清单

### 数据迁移相关

#### configureDtsJob - 配置DTS数据迁移任务，将一个RDS-MySQL中的数据迁移到另外一个RDS-MySQL中。
- **region_id** (字符串, 必需): 实例所在的区域（例如：杭州 "cn-hangzhou"，北京 “cn-beijing”）。
- **job_type** (字符串, 必需): DTS任务类型（例如：同步任务 “SYNC”，迁移任务 “MIGRATION”）。
- **source_endpoint_region** (字符串, 必需): 源数据库所在的区域（例如：杭州 "cn-hangzhou"，北京 “cn-beijing”）。
- **source_endpoint_instance_type** (字符串, 必需): 源数据库实例类型（例如： RDS）
- **source_endpoint_engine_name** (字符串, 必需): 源数据库引擎类型（例如：“MySQL”）。
- **source_endpoint_instance_id** (字符串, 必需): 源数据库实例ID（例如：“rm-xxx”）。
- **source_endpoint_user_name** (字符串, 必需): 源数据库连接用户名。
- **source_endpoint_password** (字符串, 必需): 源数据库连接密码。
- **destination_endpoint_region** (字符串, 必需): 目标数据库所在的区域（例如：杭州 "cn-hangzhou"，北京 “cn-beijing”）。
- **destination_endpoint_instance_type** (字符串, 必需): 目标数据库实例类型（例如： RDS）
- **destination_endpoint_engine_name** (字符串, 必需): 目标数据库引擎类型（例如：“MySQL”）。
- **destination_endpoint_instance_id** (字符串, 必需): 目标数据库实例ID（例如：“rm-xxx”）。
- **destination_endpoint_user_name** (字符串, 必需): 目标数据库连接用户名。
- **destination_endpoint_password** (字符串, 必需): 目标数据库连接密码。
- **db_list** (字符串, 必需): 迁移对象，JSON字符串格式，示例1：迁移 dtstest 数据库，db_list为 {"dtstest":{"name":"dtstest","all":true}}；示例2：迁移 dtstest 数据库下的 task01 表，db_list为 {"dtstest":{"name":"dtstest","all":false,"Table":{"task01":{"name":"task01","all":true}}}}；示例3：迁移 dtstest 数据库下的 task01、task02 表，db_list为 {"dtstest":{"name":"dtstest","all":false,"Table":{"task01":{"name":"task01","all":true},"task02":{"name":"task02","all":true}}}}。

#### startDtsJob - 启动DTS迁移任务。
- **region_id** (字符串, 必需): 实例所在的区域（例如：杭州 "cn-hangzhou"，北京 “cn-beijing”）。
- **dts_job_id** (字符串, 必需): DTS任务ID。

#### getDtsJob - 获取DTS迁移任务详情信息。
- **region_id** (字符串, 必需): 实例所在的区域（例如：杭州 "cn-hangzhou"，北京 “cn-beijing”）。
- **dts_job_id** (字符串, 必需): DTS任务ID。

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

<img src="../images/ding-en.jpg" alt="Ding" width="40%">

[//]: # (<img src="http://dms-static.oss-cn-hangzhou.aliyuncs.com/mcp-readme/ding-zh-cn.jpg" alt="Ding" width="60%">)



## License
This project is licensed under the Apache 2.0 License.
