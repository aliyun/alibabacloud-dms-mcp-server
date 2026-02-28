# 数据变更流程

## 目标

通过 DMS 完成安全、可审计的数据订正流程，包括：搜索定位数据库、自然语言生成 SQL、变更前数据校验、提交审批工单、执行变更、变更后数据复核。

---

## 完整流程

### 第一步：搜索定位目标数据库

用 `alicloud-database-dms-enterprise` 调用 `SearchDatabase` 根据关键字搜索数据库，找到目标数据库并获取 `DatabaseId`。

```
输入：search_key="订单库" 或 "order_db"
输出：DatabaseId、数据库名称、实例信息
```

用 `alicloud-database-dms-enterprise` 调用 `GetDatabase` 获取数据库详细信息，确认目标库正确。

---

### 第二步：理解用户意图，生成变更 SQL

用 `alicloud-database-dms-enterprise` 调用 `GenerateSqlFromNL` (NL2SQL) 将用户的自然语言描述转换为 SQL 语句。

```
输入：question="将订单表中订单号为 ORD-2024001 的状态改为已完成"
输出：UPDATE orders SET status='completed' WHERE order_no='ORD-2024001'
```

---

### 第三步：变更前数据校验

将 UPDATE 语句的 WHERE 条件提取出来，构造等价的 SELECT 语句，用于检查即将被修改的数据。

用 `alicloud-database-dms-enterprise` 调用 `ExecuteScript` 执行 SELECT 查询，确认变更范围。

```
输入：script="SELECT * FROM orders WHERE order_no='ORD-2024001'"
输出：返回即将被修改的数据记录，供用户确认
```

---

### 第四步：创建数据变更工单

用 `alicloud-database-dms-enterprise` 调用 `CreateDataCorrectOrder` 创建数据变更工单。

```
输入：
  - DatabaseId：目标数据库 ID
  - ExecSQL：UPDATE orders SET status='completed' WHERE order_no='ORD-2024001'
  - EstimateAffectRows：预估影响行数
  - Comment：变更原因说明
输出：OrderId（工单 ID）
```

---

### 第五步：提交审批

用 `alicloud-database-dms-enterprise` 调用 `SubmitOrderApproval` 提交工单进行审批。

```
输入：OrderId
输出：审批流程启动确认
```

用 `alicloud-database-dms-enterprise` 调用 `GetApprovalDetail` 查询审批详情和当前审批节点。

用 `alicloud-database-dms-enterprise` 调用 `GetOrderBaseInfo` 查询工单基本状态，等待审批通过。

---

### 第六步：执行数据变更

审批通过后，用 `alicloud-database-dms-enterprise` 调用 `ExecuteDataCorrect` 执行数据变更。

```
输入：OrderId、ActionType="EXECUTE"
输出：执行状态
```

用 `alicloud-database-dms-enterprise` 调用 `GetDataCorrectOrderDetail` 查询变更工单执行详情和进度。

用 `alicloud-database-dms-enterprise` 调用 `GetDataCorrectTaskDetail` 获取变更任务的详细执行结果。

---

### 第七步：变更后数据复核

用 `alicloud-database-dms-enterprise` 调用 `ExecuteScript` 执行 SELECT 查询，验证数据是否已正确变更。

```
输入：script="SELECT * FROM orders WHERE order_no='ORD-2024001'"
输出：确认 status 字段已更新为 'completed'
```

---

## 提示词样例汇总

### 完整流程示例

我需要将订单库中订单号为 ORD-2024001 的订单状态改为已完成，请帮我完成整个数据变更流程：先找到订单库，然后生成变更 SQL，执行变更前检查，创建变更工单并提交审批，审批通过后执行变更，最后进行数据复核。

### 分步操作示例

用 `alicloud-database-dms-enterprise` 调用 `SearchDatabase` 搜索包含 "order" 关键字的数据库，返回数据库列表。

用 `alicloud-database-dms-enterprise` 调用 `GenerateSqlFromNL`，输入问题 "将用户表中用户 ID 为 12345 的手机号更新为 13800138000"，生成对应的 UPDATE 语句。

用 `alicloud-database-dms-enterprise` 调用 `ExecuteScript` 执行 `SELECT * FROM users WHERE user_id=12345` 查看变更前的数据。

用 `alicloud-database-dms-enterprise` 调用 `CreateDataCorrectOrder` 创建数据变更工单，执行 `UPDATE users SET phone='13800138000' WHERE user_id=12345`。

用 `alicloud-database-dms-enterprise` 调用 `GetDataCorrectOrderDetail` 查询数据变更工单的审批状态和执行进度。

用 `alicloud-database-dms-enterprise` 调用 `ExecuteScript` 执行 `SELECT * FROM users WHERE user_id=12345` 验证变更后的数据是否正确。
