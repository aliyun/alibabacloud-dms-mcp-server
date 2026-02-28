# 实例管理与资源查询

## 目标

完成 DMS 中数据库实例的注册、查询、配置修改及库表资源检索。

## 提示词样例

用 `alicloud-database-dms-enterprise` 调用 `ListInstances` 列出当前 DMS 中所有已注册的数据库实例，输出实例 ID、类型和状态。

用 `alicloud-database-dms-enterprise` 调用 `RegisterInstance` 注册一个 MySQL 实例（host: 192.168.1.10, port: 3306），使用默认安全规则。

用 `alicloud-database-dms-enterprise` 调用 `SearchDatabase` 搜索包含关键词 `order` 的数据库，列出匹配的库名和所属实例。

用 `alicloud-database-dms-enterprise` 调用 `SearchTable` 在指定数据库中搜索包含 `user` 的表，输出表名、引擎和行数估算。

用 `alicloud-database-dms-enterprise` 调用 `GetMetaTableDetailInfo` 获取指定表的详细元数据（字段、索引、分区信息）。

用 `alicloud-database-dms-enterprise` 调用 `GetInstance` 获取指定实例的详细配置信息，包括连接地址、端口和安全组。
