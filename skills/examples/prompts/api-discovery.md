# API 发现与元数据

## 目标

利用 OpenAPI 元数据端点发现 DMS Enterprise 的完整 API 清单，获取 API Schema 详情。

## 版本说明

- **2018-11-01**：经典版，299 个 API，覆盖实例管理、SQL 执行、权限管理、任务编排、数据安全等
- **2025-04-14**：新版，67 个 API，覆盖 Airflow 托管、数据湖库表管理、DataAgent 协作空间、自定义 Agent、Notebook 调度

## 提示词样例

### 2018-11-01 版本

用 `alicloud-database-dms-enterprise` 执行 `scripts/list_openapi_meta_apis.py` 拉取 DMS Enterprise 的完整 API 清单并保存到 output 目录。

用 `alicloud-database-dms-enterprise` 查看 `output/alicloud-database-dms-enterprise/dms-enterprise_2018-11-01_api_list.md` 获取已生成的 299 个 API 清单。

用 `alicloud-database-dms-enterprise` 查询 `references/sources.md` 中的元数据端点，获取 `RegisterInstance` 接口的完整请求/响应 Schema。

### 2025-04-14 版本

用 `alicloud-database-dms-enterprise` 查看 `output/alicloud-database-dms-enterprise/dms_2025-04-14_api_list.md` 获取 67 个新版 API 清单，包括 Airflow、数据湖、DataAgent 等能力。

用 `alicloud-database-dms-enterprise` 查询 `ListAirflows` API 获取工作空间的 Airflow 实例列表。

用 `alicloud-database-dms-enterprise` 查询 `ListDataLakeDatabase` API 获取数据湖的数据库列表。

用 `alicloud-database-dms-enterprise` 调用 `CreateDataAgentSession` 创建 DataAgent 会话，用于 AI 智能数据分析。

### 元数据与业务知识

用 `alicloud-database-dms-enterprise` 调用 `GetTableKnowledgeInfo` 获取指定表的业务知识标注信息。

用 `alicloud-database-dms-enterprise` 调用 `EditMetaKnowledgeAsset` 为指定表添加业务含义说明。
