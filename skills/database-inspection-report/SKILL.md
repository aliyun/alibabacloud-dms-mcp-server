# 数据库运维报告 Skill

## 描述

获取阿里云 DAS（数据库自治服务）实例巡检报告。当用户需要查看数据库实例的健康巡检报告、性能巡检报告或获取指定时间范围的巡检报告详情时，请使用本技能。

支持以下场景：
- 获取最新一份巡检报告
- 获取最近 N 份巡检报告列表
- 获取指定时间范围的巡检报告
- 获取指定实例的巡检报告详情
- 查看巡检报告完整内容（不做额外加工）

## 元数据

```yaml
name: database-inspection-report
description: 获取阿里云 DAS 数据库实例巡检报告
license: Apache-2.0
compatibility: >
  需要 Python 3.6+ 以及对 das.cn-shanghai.aliyuncs.com 的 HTTPS 访问权限。
  需要阿里云访问凭据（AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess 权限）。
metadata:
  async: true
  timeout: 180
required_permissions:
  - "das:GetInstanceGroupInspectReportList"
  - "das:GetInstanceGroupInspectReportDetail"
```

## 环境变量

```bash
# 必需：阿里云访问凭据
export ALIBABA_CLOUD_ACCESS_KEY_ID="<your_access_key_id>"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="<your_access_key_secret>"

# 可选：DAS Agent ID
export ALIBABA_CLOUD_DAS_AGENT_ID="<your_agent_id>"
```

## 使用示例

### 基本调用

```bash
cd scripts

# 获取最新一份巡检报告
python3 get_inspection_report.py --latest --pipe

# 获取最近 5 份巡检报告列表
python3 get_inspection_report.py --list --limit 5 --pipe

# 获取指定实例的最新报告
python3 get_inspection_report.py --instance-id your-instance-id --latest --pipe

# 获取指定时间的报告
python3 get_inspection_report.py --instance-id your-instance-id --date 2026-04-02 --pipe

# 获取报告详情（完整内容，不做加工）
python3 get_inspection_report.py --report-id rpt_xxx --detail --pipe
```

### 输出模式

| 模式 | 参数 | 用途 |
|------|------|------|
| 默认 | 无 | 直接输出报告内容 |
| 管道 | `--pipe` | 进度到 stderr，报告到 stdout |
| JSON | `--json` | JSONL 格式，机器可读 |

## API 参考

### 1. GetInstanceGroupInspectReportList

获取实例组巡检报告列表。

**请求参数**：
- `InstanceId`: 实例 ID（可选）
- `StartTime`: 开始时间（可选）
- `EndTime`: 结束时间（可选）
- `PageNumber`: 页码（默认 1）
- `PageSize`: 每页数量（默认 10，最大 100）

**返回字段**：
- `ReportId`: 报告 ID
- `InstanceId`: 实例 ID
- `InstanceName`: 实例名称
- `ReportType`: 报告类型（日常巡检/性能巡检）
- `ReportStatus`: 报告状态（成功/失败）
- `ReportTime`: 报告生成时间
- `Score`: 健康评分

### 2. GetInstanceGroupInspectReportDetail

获取实例组巡检报告详情。

**请求参数**：
- `ReportId`: 报告 ID（必填）

**返回内容**：
- 报告基本信息
- 巡检项详情（检查项、状态、建议）
- 性能指标分析
- 异常问题列表
- 优化建议

## 行为说明

### 1. 报告内容处理

**重要原则**：报告内容直接完整给出，不做额外加工。

- ✅ 原样返回 API 返回的报告内容
- ✅ 保留所有巡检项、指标、建议
- ✅ 不总结、不摘要、不修改格式
- ❌ 不要添加 AI 的分析或评论

### 2. 时间范围处理

- `--latest`: 获取最新一份报告
- `--recent N`: 获取最近 N 份报告（默认 5）
- `--date YYYY-MM-DD`: 获取指定日期的报告
- `--start-time --end-time`: 获取时间范围内的报告

### 3. 实例筛选

- 不指定实例：获取所有实例的报告
- 指定 `--instance-id`: 获取特定实例的报告

## 错误处理

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|---------|
| InvalidReportId.NotFound | 报告 ID 不存在 | 检查报告 ID 是否正确 |
| InstanceNotActivated | 实例未激活 | 实例需在 DAS 中完成激活 |
| PermissionDenied | 权限不足 | 检查 RAM 权限配置 |

### 错误输出

```json
{
  "type": "error",
  "code": "InvalidReportId.NotFound",
  "message": "指定的报告 ID 不存在"
}
```

## 相关文档

- [API Reference](./references/api-reference.md) - API 详细参考
- [RAM Policies](./ram-policies.md) - 权限配置
- [DAS 官方文档](https://help.aliyun.com/zh/das/)

## 版本

- API 版本：2020-01-16
- Skill 版本：1.0.0
- Endpoint: das.cn-shanghai.aliyuncs.com
