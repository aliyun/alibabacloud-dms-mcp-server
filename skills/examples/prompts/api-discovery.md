# API 发现与元数据

## 目标

利用 OpenAPI 元数据端点发现 DMS Enterprise 的完整 API 清单，获取 API Schema 详情。

## 提示词样例

用 `alicloud-database-dms-enterprise` 执行 `scripts/list_openapi_meta_apis.py` 拉取 DMS Enterprise 的完整 API 清单并保存到 output 目录。

用 `alicloud-database-dms-enterprise` 查看 `output/alicloud-database-dms-enterprise/dms-enterprise_2018-11-01_api_list.md` 获取已生成的 299 个 API 清单。

用 `alicloud-database-dms-enterprise` 查询 `references/sources.md` 中的元数据端点，获取 `RegisterInstance` 接口的完整请求/响应 Schema。

用 `alicloud-database-dms-enterprise` 调用 `GetTableKnowledgeInfo` 获取指定表的业务知识标注信息。

用 `alicloud-database-dms-enterprise` 调用 `EditMetaKnowledgeAsset` 为指定表添加业务含义说明。
