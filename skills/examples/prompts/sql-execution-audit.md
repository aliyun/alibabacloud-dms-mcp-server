# SQL 执行与审核

## 目标

通过 DMS 执行 SQL 脚本、进行 SQL 审核与优化建议。

## 提示词样例

用 `alicloud-database-dms-enterprise` 调用 `ExecuteScript` 在指定数据库上执行 `SELECT COUNT(*) FROM orders WHERE status='pending'`，返回结果。

用 `alicloud-database-dms-enterprise` 调用 `CreateSQLReviewOrder` 提交一条 ALTER TABLE 语句进行 SQL 审核，获取审核工单号。

用 `alicloud-database-dms-enterprise` 调用 `GetSQLReviewCheckResultStatus` 查询上述 SQL 审核结果，判断是否通过。

用 `alicloud-database-dms-enterprise` 调用 `GetSQLReviewOptimizeDetail` 获取审核中的优化建议详情。

用 `alicloud-database-dms-enterprise` 调用 `ListSQLReviewOriginSQL` 列出某次审核中涉及的原始 SQL 清单。

用 `alicloud-database-dms-enterprise` 调用 `ListSQLExecAuditLog` 查询最近 24 小时的 SQL 执行审计日志，按用户聚合统计。
