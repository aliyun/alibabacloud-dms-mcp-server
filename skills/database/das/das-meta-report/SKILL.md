---
name: das-business-impact-report
description: Generate DAS (Database Autonomy Service) operations daily reports with business impact analysis by combining DAS运维日报 with Meta Agent data asset inventory. Use when user requests "带有业务影响分析的运维日报" or similar queries about DAS reports with business context.
async: true
timeout: 1800
---

Category: service

# DAS 运维日报 + 业务影响分析

This skill combines Alibaba Cloud DAS (Database Autonomy Service) daily operations reports with Meta Agent data asset inventory to provide business impact analysis for database issues.

## 前置要求

- **AccessKey 要求**：使用 RAM 用户/角色最小权限的 AccessKey，优先从环境变量读取 AK/SK。
- **环境变量**（优先）：`ALICLOUD_ACCESS_KEY_ID` / `ALICLOUD_ACCESS_KEY_SECRET` / `ALICLOUD_REGION_ID`
- **Region 默认值**：如未指定 Region，默认使用 `cn-shanghai`
- **权限要求**：确保 RAM 用户具有 DAS 全量访问权限 + DMS Enterprise 读取权限
- **OpenAPI 机制**：DAS API 为 RPC 签名机制，优先使用官方 SDK 或 aliyun-cli

## 工作流

1. **获取 DAS 运维日报**：调用 `GetInstanceGroupInspectReportList` 和 `GetInstanceGroupInspectReportDetail` API 获取最新的 DAS 运维日报
2. **获取 Meta Agent 数据资产**：调用 DMS Enterprise `GetUserActiveTenant` 获取租户ID，然后通过 `ListInstances` -> `ListDatabases` -> `ListTables` 找到对应的业务表，最后调用 `GetTableKnowledgeInfo` 获取表的业务知识信息
3. **评估 Meta Agent 分析结果有效性**：
   - **时间相近情况**：如果 Meta Agent 分析时间与运维日报时间间隔 ≤ 6个月，且分析的实例与运维日报中的实例有重合，则认为分析结果有效
   - **时间间隔过长或实例不匹配情况**：如果 Meta Agent 分析时间与运维日报时间间隔 > 6个月，或 Meta Agent 分析的实例与运维日报中的实例无重合，则认为分析结果无效
4. **合并报告内容**：
   - **有效情况**：在【重点问题与优化建议】、【慢SQL top 10】、【高危SQL安全威胁详情】、【详细问题与优化建议】这些版块中添加【业务影响】列，基于真实的 Meta Agent 分析结果生成业务影响描述
   - **无效情况**：保持原 DAS 报告格式，不添加【业务影响】列
5. **输出增强报告**：在报告末尾添加 Meta Agent 分析状态说明，引导用户开启或更新 Meta Agent 分析

## Meta Agent API 调用流程

### 1. 获取租户ID
```bash
aliyun dms-enterprise GetUserActiveTenant --region cn-hangzhou
```

### 2. 获取实例列表
```bash
aliyun dms-enterprise ListInstances --Tid <租户ID> --region cn-hangzhou
```

### 3. 获取数据库列表（针对每个相关实例）
```bash
aliyun dms-enterprise ListDatabases --InstanceId <实例ID> --Tid <租户ID> --region cn-hangzhou
```

### 4. 获取表列表（针对每个业务数据库）
```bash
aliyun dms-enterprise ListTables --DatabaseId <数据库ID> --Tid <租户ID> --region cn-hangzhou
```

### 5. 获取表业务知识信息（针对运维日报中涉及的表）
```bash
aliyun dms-enterprise GetTableKnowledgeInfo --DbId <数据库ID> --TableName <表名> --region cn-hangzhou
```

## 报告结构

输出保持原始 DAS 报告的完整结构，在以下版块条件性添加【业务影响】列：
- **重点问题与优化建议 table**
- **慢SQL Top 10 table** 
- **高危SQL安全威胁详情 table**
- **详细问题与优化建议表格**

所有原始内容保持不变。

## 业务影响分析来源

- 表描述信息（来自 DMS Enterprise 业务知识）
- 列级业务描述和数据敏感性
- 实例别名和业务上下文映射
- 数据库模式的业务含义

## Meta Agent 分析结果有效性判断规则

### 有效情况（添加业务影响列）
- Meta Agent 分析时间与运维日报时间间隔 ≤ 6个月
- Meta Agent 分析的实例与运维日报中的实例有重合（至少一个实例匹配）
- Meta Agent 分析结果包含运维日报中涉及的表

### 无效情况（不添加业务影响列，仅在末尾说明）
- Meta Agent 分析时间与运维日报时间间隔 > 6个月
- Meta Agent 分析的实例与运维日报中的实例无重合
- Meta Agent 未开启或未运行过分析
- 无法获取 Meta Agent 分析结果（权限问题等）

## 报告末尾引导说明

无论 Meta Agent 分析结果是否有效，都在报告末尾添加引导说明：

**Meta Agent 分析状态说明**：
- **有效情况**：说明结合了具体的 Meta Agent 分析时间，确认分析结果有效，并建议定期运行 Meta Agent 分析
- **无效情况**：说明 Meta Agent 分析时间过久/实例不匹配/未开启，建议用户在 DMS Enterprise 控制台手动触发 Meta Agent 资产盘点任务，以获得准确的业务影响分析

## 选择问题（不确定时提问）

1. **运维日报需要开通 DAS agent，结合业务信息需要开通 Meta agent，请问是否已开通？**
2. **目标数据库实例所在地域是什么？**（默认 cn-shanghai）
3. **是否需要特定时间范围的运维日报？**（默认获取最近24小时的报告）

## References

- DAS API documentation: `references/das-api.md`
- DMS Enterprise API documentation: `references/dms-api.md`
- Business impact analysis methodology: `references/business-impact-methodology.md`
- Business impact templates: `references/business_impact_templates.md`