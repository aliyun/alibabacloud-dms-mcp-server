# DAS API Reference - 巡检报告

## API 列表

### 1. GetInstanceGroupInspectReportList

获取实例组巡检报告列表。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| InstanceId | String | 否 | 实例 ID |
| StartTime | String | 否 | 开始时间（ISO 8601） |
| EndTime | String | 否 | 结束时间（ISO 8601） |
| PageNumber | Integer | 否 | 页码（默认 1） |
| PageSize | Integer | 否 | 每页数量（默认 10，最大 100） |

**返回字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| ReportList | Array | 报告列表 |
| ├─ ReportId | String | 报告 ID |
| ├─ InstanceId | String | 实例 ID |
| ├─ InstanceName | String | 实例名称 |
| ├─ ReportType | String | 报告类型 |
| ├─ ReportStatus | String | 报告状态 |
| ├─ ReportTime | String | 报告生成时间 |
| └─ Score | Integer | 健康评分 |
| TotalCount | Integer | 总数 |
| PageNumber | Integer | 当前页码 |
| PageSize | Integer | 每页数量 |

**示例**：

```json
{
  "RequestId": "xxx",
  "Data": {
    "ReportList": [
      {
        "ReportId": "rpt_xxx",
        "InstanceId": "your-instance-id",
        "InstanceName": "my-db",
        "ReportType": "DAILY",
        "ReportStatus": "SUCCESS",
        "ReportTime": "2026-04-02T12:00:00Z",
        "Score": 95
      }
    ],
    "TotalCount": 1
  }
}
```

### 2. GetInstanceGroupInspectReportDetail

获取实例组巡检报告详情。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ReportId | String | 是 | 报告 ID |

**返回内容**：

| 字段 | 类型 | 说明 |
|------|------|------|
| ReportInfo | Object | 报告基本信息 |
| ├─ ReportId | String | 报告 ID |
| ├─ InstanceId | String | 实例 ID |
| ├─ ReportType | String | 报告类型 |
| └─ ReportTime | String | 报告时间 |
| InspectionItems | Array | 巡检项详情 |
| ├─ ItemName | String | 检查项名称 |
| ├─ ItemStatus | String | 检查状态 |
| ├─ ItemScore | Integer | 检查得分 |
| └─ Suggestion | String | 优化建议 |
| PerformanceMetrics | Object | 性能指标 |
| ExceptionList | Array | 异常问题列表 |

**示例**：

```json
{
  "RequestId": "xxx",
  "Data": {
    "ReportInfo": {
      "ReportId": "rpt_xxx",
      "InstanceId": "your-instance-id",
      "ReportType": "DAILY",
      "ReportTime": "2026-04-02T12:00:00Z"
    },
    "InspectionItems": [
      {
        "ItemName": "CPU 使用率",
        "ItemStatus": "NORMAL",
        "ItemScore": 100,
        "Suggestion": "CPU 使用率正常"
      }
    ]
  }
}
```

## 错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|---------|
| InvalidReportId.NotFound | 报告 ID 不存在 | 检查报告 ID |
| InstanceNotActivated | 实例未激活 | 在 DAS 控制台激活实例 |
| PermissionDenied | 权限不足 | 检查 RAM 权限 |

## 相关文档

- [OpenAPI 调试](https://next.api.aliyun.com/api/Das/2020-01-16/GetInstanceGroupInspectReportList)
- [DAS API 参考](https://help.aliyun.com/zh/das/developer-reference/api-das-2020-01-16)
