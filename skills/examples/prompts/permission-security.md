# 权限与安全管理

## 目标

完成 DMS 中用户权限申请、授权管理、敏感数据识别和操作审计。

## 提示词样例

用 `alicloud-database-dms-enterprise` 调用 `ListUserPermissions` 查询指定用户在所有数据库上的权限列表。

用 `alicloud-database-dms-enterprise` 调用 `GrantUserPermission` 授予指定用户对某个数据库的查询权限。

用 `alicloud-database-dms-enterprise` 调用 `RevokeUserPermission` 回收指定用户对某个数据库的变更权限。

用 `alicloud-database-dms-enterprise` 调用 `CreateOrder` 创建一个权限申请工单，申请对生产库的只读权限。

用 `alicloud-database-dms-enterprise` 调用 `ListSensitiveColumns` 列出指定数据库中被标记为敏感的列及其脱敏等级。

用 `alicloud-database-dms-enterprise` 调用 `GetOpLog` 查询最近 7 天的 DMS 操作审计日志，按操作类型分类汇总。

用 `alicloud-database-dms-enterprise` 调用 `ListSensitiveDataAuditLog` 查询敏感数据访问审计日志，输出访问者、时间和命中规则。
